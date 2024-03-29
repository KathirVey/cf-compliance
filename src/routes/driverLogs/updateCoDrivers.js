const {ttc} = require('../../services')
import {logger} from '@peoplenet/node-service-common'
import Joi from 'joi'

const route = {
    method: 'PUT',
    path: '/drivers/{driverId}/updateCoDrivers/{startDateTime}',
    handler: async ({headers, auth, params, payload}, hapi) => {
        
        const {driverId, startDateTime} = params
        const {user} = auth.artifacts   
        const pfmCid = user.companyId
        try {
            const actualHeaders = {
                ...headers,
                'x-filter-orgid': pfmCid
            }
            return ttc.put(`compliance/v1/proxy/driverlogs/updateCoDrivers/${driverId}/${startDateTime}`, payload, {headers: actualHeaders})
        } catch (error) {
            logger.debug(error, pfmCid, 'Encountered error while updating co-drivers for the drivers log')
            return hapi.response(error.description.data.detail).code(error.description.status)
        }
    },
    options: {
        description: 'driver logs route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-LOGS-WRITE'
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
