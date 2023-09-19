const {compliance} = require('../../../services')
import {logger} from '@peoplenet/node-service-common'
import Joi from 'joi'

const route = {
    method: 'GET',
    path: '/rods/{driverId}/driverLogs/{startDateTime}',
    handler: async ({headers, params}, hapi) => {
        const {driverId, startDateTime} = params
        try {
            const response = await compliance.get(`v1/driverlogids/GetIdsByAccountUsernameLogDate?username=${driverId}&&logDate=${startDateTime}`, {headers})

            return await compliance.get(`/v1/driverlogs/${response.id}`, {headers})
        } catch (error) {
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
