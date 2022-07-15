import Joi from 'joi'
import moment from 'moment'
import {iseCompliance} from '../../services'
import getIseHeaders from '../../util/getIseHeaders'
import {logger} from '@peoplenet/node-service-common'
import {isEmpty} from 'lodash'
import client from '../../elasticsearch/client'
import search from '../../elasticsearch/search'
const ruleSets = require('../../config/driverRuleSets')
const redisClient = require('../../redis/redisClient')
const DEFAULT_RULESET_VALUE = -1

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

        // TODO: remove the config and caching after EFS sends the required ruleset info on the message
        const rulesetId = ruleSets[hosMessage.hosRuleSetName]
        const rulesetIdFound = rulesetId && rulesetId > 0

        if (!rulesetIdFound) {
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
            logger.trace(`Skipping message since a more recent HOS event has been already processed for driverId: ${driver.id}.`)
            return hapi.response({message: `Skipping message since a more recent HOS event has been already processed for driverId: ${driver.id}.`}).code(200)
        }

        const iseHeaders = getIseHeaders(companyId)

        let ruleSet = null
        if (rulesetIdFound) {
            const cacheKey = `ruleset:${rulesetId}`
            const {[cacheKey]: ruleSetFromCache} = await redisClient.get(cacheKey)
            if (isEmpty(ruleSetFromCache)) {
                ruleSet = await iseCompliance.get(`/api/HosRuleSet/details/${rulesetId}`, {headers: iseHeaders})
                await redisClient.set({[cacheKey]: ruleSet})
            } else {
                ruleSet = ruleSetFromCache
            }
        }

        let driverVehicle
        try {
            driverVehicle = await iseCompliance.get(`/api/Drivers/byDriverId/${loginId}/vehicle`, {headers: iseHeaders})
        } catch (error) {
            if (error.description?.status === 404) {
                logger.warn(`Got 404 from ISE; no vehicle found for driver ${loginId}`)
                driverVehicle = null
            }
        }

        if (driverVehicle) {
            hosMessage.vehicleId = driverVehicle.vehicleId
        }

        const totalTimeInCurrentDutyStatus = getTimeDiff(hosMessage.mostRecentStatusDateTime)
        const hoursOfService = {
            ...hosMessage,
            lastLogbookUpdateDate: moment.parseZone(hosMessage.mostRecentStatusDateTime).toISOString(),
            currentDriverType: ruleSet?.description ?? 'Unknown',
            currentDutyStatus: hosMessage.mostRecentStatus,
            totalTimeInCurrentDutyStatus,
            hoursInCurrentDutyStatus: getHoursInCurrentDutyStatus(totalTimeInCurrentDutyStatus),
            availableDriveTime: getIseDefault(hosMessage.drivingTimeLeft),
            availableDutyTime: getIseDefault(hosMessage.workshiftDuty),
            availableCycleTime: getIseDefault(hosMessage.cycleDuty),
            workShiftDriveTimeUsed: calculateTimeUsed(hosMessage.workshiftDriving, ruleSet?.workshiftDrivingMaximumTime),
            workShiftOnDutyTimeUsed: calculateTimeUsed(hosMessage.workshiftDuty, ruleSet?.workshiftOnDutyMaximumTime),
            dailyDriveTimeUsed: calculateTimeUsed(hosMessage.dailyDriving, ruleSet?.dailyDrivingMaximumTime),
            dailyOnDutyTimeUsed: calculateTimeUsed(hosMessage.dailyDuty, ruleSet?.dailyOnDutyMaximumTime),
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
        logger.trace(`Processed driver HOS event messageId: ${value.id} for driverId: ${updatedDriver._id}`)
        return hapi.response({message: `Processed driver HOS event messageId: ${value.id}, cid: ${value.data.accountIdentifiers.pfmId} for driverId: ${updatedDriver._id}`}).code(204)
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
    // ruleset values for dailyDriving/dailyDuty max time are -1 for US driver types
    if (ruleSetConstraint === DEFAULT_RULESET_VALUE) {
        return 'N/A'
    }
    if (Object.keys(ISE_CONSTANTS).includes(field)) {
        return ISE_CONSTANTS[field]
    }
    const fieldInMinutes = convertToMinutes(field)
    const diff = ruleSetConstraint - fieldInMinutes
    return getDuration(diff)
}

const getHoursInCurrentDutyStatus = field => {
    const time = field.split(':')
    return parseInt(time[0]) + parseInt(time[1]) / 60 //converting to fractional hours for filtering
}

const getIseDefault = field => {
    if (Object.keys(ISE_CONSTANTS).includes(field)) {
        return ISE_CONSTANTS[field]
    }
    return getDuration(convertToMinutes(field))
}

const convertToMinutes = field => {
    // ignore seconds
    return Math.floor(moment.duration(field).asMinutes())
}

const getTimeDiff = field => {
    const elapsedMinutes = moment().diff(moment(field), 'minutes')
    return getDuration(elapsedMinutes)
}

const getDuration = elapsedMinutes => {
    // get total duration in hours and minutes
    // eg: 62 => 01:02, 2709 => 45:09
    const hours = elapsedMinutes / 60
    const minutes = elapsedMinutes % 60
    return `${format(hours)}:${format(minutes)}`
}

const format = value => {
    return String(Math.floor(value)).padStart(2, '0')
}

const ISE_CONSTANTS = {
    '-1.00:00:00': 'N/A',
    '-2.00:00:00': 'EXEMPT',
    '-3.00:00:00': 'UNKNOWN',
    '-4.00:00:00': 'ELD EXEMPT'
}
