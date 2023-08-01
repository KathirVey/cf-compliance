const {compliance} = require('../../../services')
import {logger} from '@peoplenet/node-service-common'
import Joi from 'joi'

const route = {
    method: 'GET',
    path: '/hoursOfService/availability/{driverId}',
    handler: async ({headers, auth, params}, hapi) => {
        const {driverId} = params
        const {user} = auth.artifacts
        const pfmCid = user.companyId
        try {
            return await compliance.get(`/v1/availability/${driverId}`, {headers})
        } catch (error) {
            logger.debug(error, pfmCid, 'Encountered error while fetching availability from hours-of-service')
            return hapi.response(error.description.data).code(error.description.status)
        }
    },
    options: {
        description: 'availability route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-LOGS-READ',
            overridePermission: ['CXS-CUSTOMER-READ']
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
