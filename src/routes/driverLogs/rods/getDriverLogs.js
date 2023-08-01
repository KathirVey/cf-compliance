const {compliance} = require('../../../services')
import {logger} from '@peoplenet/node-service-common'
import Joi from 'joi'

const route = {
    method: 'GET',
    path: '/rods/{driverId}/driverLogs/{startDateTime}',
    handler: async ({headers, auth, params}, hapi) => {
        const {driverId, startDateTime} = params
        const {user} = auth.artifacts
        const pfmCid = user.companyId
        try {
            const actualHeaders = {
                ...headers,
                'x-filter-orgid': pfmCid
            }
            return await compliance.get(`/v2/proxy/driverlogs/${driverId}/${startDateTime}`, {headers: actualHeaders})
        } catch (error) {
            logger.debug(error, pfmCid, 'Encountered error while fetching driver logs from records-of-duty-status')
            return hapi.response(error.description.data.detail).code(error.description.status)
        }
    },
    options: {
        description: 'rods driver logs route',
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
