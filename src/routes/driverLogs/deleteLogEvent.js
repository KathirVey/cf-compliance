const {compliance} = require('../../services')
import getIseHeaders from '../../util/getIseHeaders'
import {logger} from '@peoplenet/node-service-common'
import Joi from 'joi'

const route = {
    method: 'POST',
    path: '/drivers/logEvents/delete/{eventKey}',
    handler: async ({auth, params, payload}, hapi) => {
        const {eventKey} = params
        const {user} = auth.artifacts
        const pfmCid = user.companyId
        
        try {
            const iseHeaders = getIseHeaders(pfmCid)
            const response = await compliance.post(`/proxy/logEvents/delete/${eventKey}`, payload, {headers: iseHeaders})
            return response
        } catch (error) {
            logger.debug(error, pfmCid, 'Encountered error while deleting log event')
            return hapi.response(error.description.data).code(error.description.status)
        }
    },
    options: {
        description: 'delete log event route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-SERVICE-CUSTOMER-DRIVER-WRITE'            
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
