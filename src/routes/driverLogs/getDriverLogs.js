const {compliance} = require('../../services')
import getIseHeaders from '../../util/getIseHeaders'
import {logger} from '@peoplenet/node-service-common'
import Joi from 'joi'

const route = {
    method: 'GET',
    path: '/drivers/{driverId}/driverLogs/{startDateTime}',
    handler: async ({auth, params}, hapi) => {

        const {driverId, startDateTime} = params
        const {user} = auth.artifacts
        const pfmCid = user.companyId
        try {
            const iseHeaders = getIseHeaders(pfmCid)
            const driverLogs = await compliance.get(`/proxy/driverlogs/${driverId}/${startDateTime}`, {headers: iseHeaders})
            return driverLogs
        } catch (error) {
            logger.debug(error, pfmCid, 'Encountered error while fetching driver logs from ISE')
        }
        return hapi.response().code(200)
    },
    options: {
        description: 'driver logs route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-SERVICE-CUSTOMER-DRIVER-READ',
            overridePermission: ['CXS-CUSTOMER-READ']
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
