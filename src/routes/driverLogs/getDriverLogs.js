const {compliance} = require('../../services')
import {logger} from '@peoplenet/node-service-common'
import Joi from 'joi'

const route = {
    method: 'GET',
    path: '/drivers/{driverId}/driverLogs/{startDateTime}',
    handler: async ({headers, auth, params}, hapi) => {

        const {driverId, startDateTime} = params
        const {user} = auth.artifacts
        const pfmCid = user.companyId
        try {
            const actualHeaders = {
                ...headers,
                'x-filter-orgid': pfmCid
            }
            const driverLogs = await compliance.get(`/v1/proxy/driverlogs/${driverId}/${startDateTime}`, {headers: actualHeaders})
            return driverLogs
        } catch (error) {
            logger.debug(error, pfmCid, 'Encountered error while fetching driver logs from ISE')
            return hapi.response(error.description.data.detail).code(error.description.status)
        }
    },
    options: {
        description: 'driver logs route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-LOGS-READ',
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
