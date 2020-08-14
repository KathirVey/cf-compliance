import Joi from '@hapi/joi'
import moment from 'moment'
import querystring from 'querystring'
import {pick, isObject} from 'lodash'
import {authHeaders} from '@peoplenet/node-service-common'
import {iseCompliance} from '../../services'

export default {
    method: 'GET',
    path: '/drivers/login/{loginId}/hoursOfService',
    async handler({headers, params, query}) {
        const {loginId} = params
        const options = {
            startDateTime: moment().subtract(1, 'weeks').toISOString(),
            ...pick(query, ['startDateTime', 'endDateTime']),
            driverId: loginId
        }

        const [availability, certification] = await Promise.all([
            iseCompliance.get(`/api/DriverLogs/availability/byDriverId/${loginId}`, {headers}),
            iseCompliance.get(`/api/v2/DriverLogs/certificationStatus?${querystring.stringify(options)}`, {headers})
        ]).catch(error => {
            if (error.description?.status === 404) {
                return []
            }
            throw error
        })

        return {
            availability: (availability?.availableByRule || []).map(rule =>
                Object.entries(pick(rule, availabilityFields))
                    .reduce((acc, [key, value]) => {
                        if (isObject(value)) {
                            return {...acc, ...value}
                        } else {
                            return {...acc, [key]: value}
                        }
                    }, {})),
            certification: certification || []
        }
    },
    options: {
        description: 'Get hours of service info for a driver',
        tags: ['api'],
        auth: 'user-profile',
        app: {permission: 'DRIVER-SERVICE-CUSTOMER-DRIVER-READ'},
        validate: {
            headers: authHeaders,
            params: Joi.object({
                loginId: Joi.string().required()
            }).required().description('Driver Login ID')
        }
    }
}

const availabilityFields = [
    'ruleType',
    'availability.workshiftDrivingTime',
    'availability.workshiftDutyTime',
    'availability.cycleDutyTime',
    'availability.workshiftRestBreakTime',
    'ruleSet.workshiftDrivingMaximumTime',
    'ruleSet.workshiftOnDutyMaximumTime',
    'ruleSet.cycleOnDutyMaximumTime',
    'ruleSet.workshiftRestBreakMaximumOnDutyTime'
]

