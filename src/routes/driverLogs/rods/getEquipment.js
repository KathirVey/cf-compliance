const {ttc} = require('../../../services')
import Joi from 'joi'
import {logger} from '@peoplenet/node-service-common'

const route = {
    method: 'GET',
    path: '/equipment/{customerVehicleId}',
    handler: async ({headers, params}, hapi) => {
        const {customerVehicleId} = params
        try {
            const res = await ttc.get(`equipment/v1/equipments/equipmentNumber/${customerVehicleId}`, {headers})
            return res.equipmentId
        } catch (error) {
            logger.error(error, 'Encountered error while fetching equipments from equipment service')
            return hapi.response(error.description.data).code(error.description.status)
        }
    },
    options: {
        description: 'equipment service route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-LOGS-UDE-MANAGE',
            overridePermission: ['CXS-CUSTOMER-READ']
        },
        tags: ['api'],
        validate: {
            params: Joi.object({
                customerVehicleId: Joi.string().required()
            }).required().description('Customer Vehicle Id is required')
        }
    }
}

export default route
