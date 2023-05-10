const {compliance} = require('../../services')
import getIseHeaders from '../../util/getIseHeaders'
import {logger} from '@peoplenet/node-service-common'
import Joi from 'joi'

const route = {
    method: 'PUT',
    path: '/drivers/{driverId}/updateCoDrivers/{startDateTime}',
    handler: async ({auth, params, payload}, hapi) => {
        
        const {driverId, startDateTime} = params
        const {user} = auth.artifacts   
        const pfmCid = user.companyId
        try {
            const iseHeaders = getIseHeaders(pfmCid)
            const res = await compliance.put(`proxy/driverlogs/updateCoDrivers/${driverId}/${startDateTime}`, payload, {headers: iseHeaders})
            return res

        } catch (error) {
            logger.debug(error, pfmCid, 'Encountered error while updating co-drivers for the drivers log')
            return hapi.response(error.description.data).code(error.description.status)
        }
    },
    options: {
        description: 'driver logs route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-SERVICE-CUSTOMER-DRIVER-WRITE'
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
