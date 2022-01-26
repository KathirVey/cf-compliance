import Joi from 'joi'
import moment from 'moment'
import querystring from 'querystring'
import {pick, isObject} from 'lodash'
import {authHeaders, logger} from '@peoplenet/node-service-common'
import {iseCompliance} from '../../services'
import getIseHeaders from '../../util/getIseHeaders'

export default {
    method: 'GET',
    path: '/drivers/login/{loginId}/hoursOfService',
    async handler({auth, params, query}) {
        const {loginId} = params
        const options = {
            startDateTime: moment().subtract(1, 'weeks').toISOString(),
            ...pick(query, ['startDateTime', 'endDateTime']),
            driverId: loginId
        }
        const {user, hasPermission} = auth.artifacts
        const pfmCid = hasPermission('CXS-CUSTOMER-READ') ? query.pfmCid : user.companyId

        const iseHeaders = getIseHeaders(pfmCid)
        const [availability, certification] = await Promise.all([
            iseCompliance.get(`/api/DriverLogs/availability/byDriverId/${loginId}`, {headers: iseHeaders}),
            iseCompliance.get(`/api/v2/DriverLogs/certificationStatus?${querystring.stringify(options)}`, {headers: iseHeaders})
        ]).catch(error => {
            if (error.description?.status === 404) {
                logger.debug('Got 404 from ISE; returning []')
                return []
            }
            throw error
        })

        return {
            availability: (availability?.availableByRule || []).map(rule => {
                const hos = Object.entries(pick(rule, availabilityFields))
                    .reduce((acc, [key, value]) => isObject(value) ? {...acc, ...value} : {...acc, [key]: value}, {})

                const overallDrivingTimeConstraint = getConstraint(hos.overallDrivingTime, ['workshiftDutyTime', 'cycleDutyTime', 'workshiftRestBreakTime'], hos)
                const overallDutyTimeConstraint = getConstraint(hos.overallDutyTime, ['cycleDutyTime'], hos)

                return {
                    ...hos,
                    overallDrivingTimeConstraint,
                    overallDutyTimeConstraint
                }
            }),
            certification: certification || []
        }
    },
    options: {
        description: 'Get hours of service info for a driver',
        tags: ['api'],
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-SERVICE-CUSTOMER-DRIVER-READ',
            overridePermission: ['CXS-CUSTOMER-READ']
        },
        validate: {
            headers: authHeaders,
            params: Joi.object({
                loginId: Joi.string().required()
            }).required().description('Driver Login ID')
        }
    }
}

const getConstraint = (overall, lookupOrder, data) => {
    const found = lookupOrder.filter(key => data[key] === overall)
    return found.length ? found[0] : null
}

const availabilityFields = [
    'ruleType',
    'availability.bestGuessOverallDrivingTime',
    'availability.overallDrivingTime',
    'availability.workshiftDrivingTime',
    'availability.workshiftElapsedTime',
    'availability.overallDutyTime',
    'availability.workshiftDutyTime',
    'availability.cycleDutyTime',
    'availability.workshiftRestBreakTime',
    'ruleSet.workshiftDrivingMaximumTime',
    'ruleSet.workshiftOnDutyMaximumTime',
    'ruleSet.cycleOnDutyMaximumTime',
    'ruleSet.workshiftRestBreakMinimumOffDutyTime',
    'ruleSet.workshiftRestBreakMaximumOnDutyTime'
]

