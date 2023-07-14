const {compliance} = require('../../services')
import getIseHeaders from '../../util/getIseHeaders'
import {logger} from '@peoplenet/node-service-common'
import Joi from 'joi'

const route = {
    method: 'PUT',
    path: '/drivers/{driverId}/driverLogs/saveException',
    handler: async ({auth, params, payload}, hapi) => {        
        const {driverId} = params
        const {user} = auth.artifacts   
        const pfmCid = user.companyId
        try {
            const iseHeaders = getIseHeaders(pfmCid)            
            const res = await compliance.put(`/proxy/driverlogs/saveException/${driverId}`, payload, {headers: iseHeaders})
            return res
            
        } catch (error) {
            logger.debug(error, pfmCid, 'Encountered error while saving exception')
            return hapi.response(error.description.data).code(error.description.status)
        }
    },
    options: {
        description: 'save exception route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-LOGS-WRITE'
        },
        tags: ['api'],
        validate: {
            params: Joi.object({
                driverId: Joi.string().required()                
            }).required().description('Driver ID is required')
        }
    }
} 

export default route
