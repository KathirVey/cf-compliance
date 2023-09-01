const {compliance} = require('../../services')
import {logger} from '@peoplenet/node-service-common'
import Joi from 'joi'

const route = {
    method: 'PUT',
    path: '/drivers/{driverId}/logEvents/status/{eventKey}',
    handler: async ({headers, auth, params, payload}, hapi) => {
        const {driverId, eventKey} = params
        const {user} = auth.artifacts
        const pfmCid = user.companyId

        try {
            const actualHeaders = {
                ...headers,
                'x-filter-orgid': pfmCid
            }

            const response = await compliance.put(`/v1/proxy/logEvents/${driverId}/status/${eventKey}`, payload, {headers: actualHeaders})
            return response
        } catch (error) {
            logger.debug(error, pfmCid, 'Encountered error while adding/proposing status change event')
            return hapi.response(error.description.data.detail ?? error.description.data.error).code(error.description.status)
        }
    },
    options: {
        description: 'edit status change event route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-LOGS-WRITE'
        },
        tags: ['api'],
        validate: {
            params: Joi.object({
                driverId: Joi.string().required(),
                eventKey: Joi.string().required()
            }).required().description('Driver Id and event key is required')
        }
    }
}

export default route
