const {compliance} = require('../../services')
import getIseHeaders from '../../util/getIseHeaders'
import {logger} from '@peoplenet/node-service-common'
import Joi from 'joi'

const route = {
    method: 'POST',
    path: '/drivers/{driverId}/logEvents/status',
    handler: async ({auth, params, payload}, hapi) => {
        const {driverId} = params
        const {user} = auth.artifacts
        const pfmCid = user.companyId

        try {
            const iseHeaders = getIseHeaders(pfmCid)
            const response = await compliance.post(`/proxy/logEvents/${driverId}/status`, payload, {headers: iseHeaders})

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
            permission: 'DRIVER-SERVICE-CUSTOMER-DRIVER-WRITE'            
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
