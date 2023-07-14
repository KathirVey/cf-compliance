const {compliance} = require('../../services')
import getIseHeaders from '../../util/getIseHeaders'
import {logger} from '@peoplenet/node-service-common'
import Joi from 'joi'

const route = {
    method: 'POST',
    path: '/drivers/driverLogs/deleteException/{eventKey}',
    handler: async ({auth, params, payload}, hapi) => {        
        const {eventKey} = params
        const {user} = auth.artifacts   
        const pfmCid = user.companyId
        try {
            const iseHeaders = getIseHeaders(pfmCid)
            const res = await compliance.post(`/proxy/driverlogs/deleteException/${eventKey}`, payload, {headers: iseHeaders})
            return res
            
        } catch (error) {
            logger.debug(error, pfmCid, 'Encountered error while deleting exception')
            return hapi.response(error.description.data).code(error.description.status)
        }
    },
    options: {
        description: 'delete exception route',
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
