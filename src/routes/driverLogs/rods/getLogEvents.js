const {ttc} = require('../../../services')
import {logger} from '@peoplenet/node-service-common'
import Joi from 'joi'

const route = {
    method: 'GET',
    path: '/rods/{driverId}/logEvents',
    handler: async ({headers, params, query}, hapi) => {
        const {driverId} = params

        const {source, startLogDate, endLogDate} = query
        const src = source === 'ttc' ? 'testing/' : ''
        try {
            return await ttc.get(`compliance/v1/${src}driverlogs/events/${driverId}?startLogDate=${startLogDate}&endLogDate=${endLogDate}`, {headers})
        } catch (error) {
            logger.error(error, 'Encountered error while fetching log events from records-of-duty-status')
            return hapi.response(error.description.data).code(error.description.status)
        }
    },
    options: {
        description: 'rods log events route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-LOGS-READ',
            overridePermission: ['CXS-CUSTOMER-READ']
        },
        tags: ['api'],
        validate: {
            params: Joi.object({
                driverId: Joi.string().required()
            }).required().description('Driver ID is required'),
            query: Joi.object({
                startLogDate: Joi.string().required(),
                endLogDate: Joi.string().required(),
                source: Joi.string()
            }).required().description('Start and End log dates are required')
        }
    }
}

export default route
