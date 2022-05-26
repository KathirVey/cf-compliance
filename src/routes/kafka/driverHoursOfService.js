import Joi from 'joi'
import moment from 'moment'
import {iseCompliance} from '../../services'
import getIseHeaders from '../../util/getIseHeaders'
import {logger} from '@peoplenet/node-service-common'
import client from '../../elasticsearch/client'
import search from '../../elasticsearch/search'
const ruleSets = require('../../config/driverRuleSets')

module.exports = {
    method: 'POST',
    path: '/kafka/driverHoursOfService',
    handler: async ({payload}, hapi) => {
        const {value} = payload
        const {data: hosMessage} = value
        const loginId = hosMessage.driver.username
        const companyId = hosMessage.accountIdentifiers.pfmId

        if (isNaN(companyId)) {
            logger.error(`Invalid pfmId: ${hosMessage.accountIdentifiers.pfmId} on incoming message.`)
            return hapi.response({message: `Invalid pfmId: ${hosMessage.accountIdentifiers.pfmId} on incoming message.`}).code(200)
        }

        // TODO: remove the config after EFS sends the required ruleset info on the message
        const rulesetId = ruleSets[hosMessage.hosRuleSetName]
        const rulesetIdNotFound = !rulesetId || rulesetId < 0

        if (rulesetIdNotFound) {
            logger.warn(`Unable to find ruleSetId for: ${hosMessage.hosRuleSetName} in driverRuleSets config.`)
        }

        const [driver] = await search({
            select: [],
            from: 'drivers',
            where: {
                'externalSources.eFleetSuite.driverId.keyword': loginId,
                'customer.companyId': parseInt(companyId)
            }
        })

        if (!driver) {
            logger.error(`Unable to find driver with loginId: ${hosMessage.driver.username} in search.`)
            return hapi.response({message: `Unable to find driver with loginId: ${hosMessage.driver.username} in search.`}).code(200)
        }

        const skipMessage = driver.hasOwnProperty('hoursOfService')
            && moment(driver.hoursOfService.lastUpdatedAt).isAfter(hosMessage.lastUpdatedAt)
        if (skipMessage) {
            logger.info('Skipping message since a more recent HOS event has been already processed.')
            return hapi.response({message: 'Skipping message since a more recent HOS event has been already processed.'}).code(200)
        }

        const iseHeaders = getIseHeaders(companyId)

        const ruleSet = rulesetIdNotFound
            ? null
            : await iseCompliance.get(`/api/HosRuleSet/details/${rulesetId}`, {headers: iseHeaders})

        let driverVehicle
        try {
            driverVehicle = await iseCompliance.get(`/api/Drivers/byDriverId/${loginId}/vehicle`, {headers: iseHeaders})
        } catch (error) {
            if (error.description?.status === 404) {
                logger.warn(`Got 404 from ISE; no vehicle found for driver ${loginId}`)
                driverVehicle = null
            }
        }

        hosMessage.vehicleId = driverVehicle ? driverVehicle.vehicleId : 'Unavailable'

        const hoursOfService = {
            ...hosMessage,
            lastLogbookUpdateDate: hosMessage.mostRecentStatusDateTime,
            currentDriverType: hosMessage.hosRuleSetName,
            currentDutyStatus: hosMessage.mostRecentStatus,
            totalTimeInCurrentDutyStatus: getTimeDiff(hosMessage.mostRecentStatusDateTime),
            availableDriveTime: getIseDefault(hosMessage.drivingTimeLeft),
            driveTimeUsed: calculateTimeUsed(hosMessage.dailyDriving, ruleSet?.workshiftDrivingMaximumTime),
            onDutyTimeUsed: calculateTimeUsed(hosMessage.dailyDuty, ruleSet?.workshiftOnDutyMaximumTime),
            timeUntilBreak: getIseDefault(hosMessage.workshiftRestBreak),
            cycleTimeUsed: calculateTimeUsed(hosMessage.cycleDuty, ruleSet?.cycleOnDutyMaximumTime)
        }

        const {body: updatedDriver} = await client.update({
            index: 'driver',
            type: '_doc',
            id: driver.id,
            body: {
                doc: {hoursOfService}
            },
            doc_as_upsert: true
        })
        logger.info(`Processed driver HOS event messageId: ${value.id} for driverId: ${updatedDriver._id}`)
        return hapi.response({message: `Processed driver HOS event messageId: ${value.id} for driverId: ${updatedDriver._id}`}).code(204)
    },
    options: {
        description: 'Update search based on driver hours of service events',
        tags: ['api'],
        validate: {
            payload: Joi.object().required()
        }
    }
}

const calculateTimeUsed = (field, ruleSetConstraint) => {
    if (!ruleSetConstraint) {
        return 'Unknown'
    }
    if (Object.keys(ISE_CONSTANTS).includes(field)) {
        return ISE_CONSTANTS[field]
    }
    const fieldInMinutes = convertToMinutes(field)
    const diff = ruleSetConstraint - fieldInMinutes
    return getHoursAndMinutes(diff)
}

const getIseDefault = field => {
    if (Object.keys(ISE_CONSTANTS).includes(field)) {
        return ISE_CONSTANTS[field]
    }
    return getHoursAndMinutes(convertToMinutes(field))
}

const convertToMinutes = field => {
    // ignore seconds
    return Math.floor(moment.duration(field).asMinutes())
}

const getTimeDiff = field => {
    const elapsedMinutes = moment().diff(moment(field), 'minutes')
    return getHoursAndMinutes(elapsedMinutes)
}

const getHoursAndMinutes = elapsedMinutes => {
    return moment().startOf('day').add(elapsedMinutes, 'minutes').format('HH:mm')
}

const ISE_CONSTANTS = {
    '-1.00:00:00': 'N/A',
    '-2.00:00:00': 'EXEMPT',
    '-3.00:00:00': 'UNKNOWN',
    '-4.00:00:00': 'ELD EXEMPT'
}
