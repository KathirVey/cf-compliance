const {compliance} = require('../../services')
import {logger} from '@peoplenet/node-service-common'
import Joi from 'joi'

const route = {
    method: 'POST',
    path: '/drivers/{driverId}/logEvents/status',
    handler: async ({headers, auth, params, payload}, hapi) => {
        const {driverId} = params
        const {user} = auth.artifacts
        const pfmCid = user.companyId

        try {
            const actualHeaders = {
                ...headers,
                'x-filter-orgid': pfmCid
            }

            const response = await compliance.post(`/v1/proxy/logEvents/${driverId}/status`, payload, {headers: actualHeaders})
            return response
        } catch (error) {
            logger.debug(error, pfmCid, 'Encountered error while adding/proposing status change event')
            return hapi.response(error.description.data).code(error.description.status)
        }
    },
    options: {
        description: 'add status change event route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-LOGS-WRITE'
        },
        tags: ['api'],
        validate: {
            params: Joi.object({
                driverId: Joi.string().required()
            }).required().description('Driver Id is required')
        }
    }
}

export default route
