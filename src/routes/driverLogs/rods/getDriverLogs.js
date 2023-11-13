const {compliance} = require('../../../services')
import {logger} from '@peoplenet/node-service-common'
import Joi from 'joi'

const route = {
    method: 'GET',
    path: '/rods/{driverId}/driverLogs/{startDateTime}',
    handler: async ({headers, params, query}, hapi) => {
        const {driverId, startDateTime} = params
        const {source} = query
        try {
            const src = source === 'ttc' ? 'testing/' : ''
            const response = await compliance.get(`v1/${src}driverlogids/GetIdsByAccountUsernameLogDate?username=${driverId}&logDate=${startDateTime}`, {headers})

            if (response.id) {
                return await compliance.get(`/v1/${src}driverlogs/${response.id}`, {headers})
            }

            const carryOverEvent = await compliance.get(`/v1/${src}driverlogs/events/${driverId}?startLogDate=${startDateTime}&endLogDate=${startDateTime}`, {headers})

            return {
                messageType: 'noLogs',
                logEvents: carryOverEvent
            }
        } catch (error) {
            const message = error?.description?.data?.detail
            if (message && message.includes('Driver with accountId')) {
                return {messageType: 'incorrectAccount'}
            } 

            logger.error(error, 'Encountered error while fetching driver logs from records-of-duty-status')
            return hapi.response(error.description.data).code(error.description.status)
        }
    },
    options: {
        description: 'rods driver logs route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-LOGS-READ',
            overridePermission: ['CXS-CUSTOMER-READ']
        },
        tags: ['api'],
        validate: {
            params: Joi.object({
                driverId: Joi.string().required(),
                startDateTime: Joi.string().required()
            }).required().description('Driver ID and Start Date Time are required')
        }
    }
} 

export default route
