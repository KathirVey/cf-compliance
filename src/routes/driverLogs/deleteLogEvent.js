const {compliance} = require('../../services')
import {logger} from '@peoplenet/node-service-common'
import Joi from 'joi'

const route = {
    method: 'POST',
    path: '/drivers/logEvents/delete/{eventKey}',
    handler: async ({headers, auth, params, payload}, hapi) => {
        const {eventKey} = params
        const {user} = auth.artifacts
        const pfmCid = user.companyId
        
        try {
            const actualHeaders = {
                ...headers,
                'x-filter-orgid': pfmCid
            }
            const response = await compliance.post(`/v1/proxy/logEvents/delete/${eventKey}`, payload, {headers: actualHeaders})
            return response
        } catch (error) {
            logger.debug(error, pfmCid, 'Encountered error while deleting log event')
            return hapi.response(error.description.data.detail).code(error.description.status)
        }
    },
    options: {
        description: 'delete log event route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-LOGS-WRITE'            
        },
        tags: ['api'],
        validate: {
            params: Joi.object({
                eventKey: Joi.string().required()
            }).required().description('Event Key is required')
        }
    }
}

export default route
