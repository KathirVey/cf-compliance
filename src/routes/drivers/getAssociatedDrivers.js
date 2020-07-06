import Joi from '@hapi/joi'
import {authHeaders} from '@peoplenet/node-service-common'
import {iseCompliance} from '../../services'

export default {
    method: 'GET',
    path: '/driversByVehicle/{id}',
    async handler({headers, params}) {
        const {id} = params

        try {
            const drivers = await iseCompliance.get(`/api/vehicles/byVehicleId/${id}/drivers`, {headers})
            return drivers
        } catch (error) {
            if (error.description?.status === 404) { // compliance throws an error if there are no assigned drivers
                return []
            }
            throw error
        }
    },
    options: {
        description: 'Get active drivers for a vehicle',
        tags: ['api'],
        auth: 'user-profile',
        app: {permission: 'DRIVER-SERVICE-CUSTOMER-DRIVER-READ'},
        validate: {
            headers: authHeaders,
            params: Joi.object({
                id: Joi.string().required()
            }).required().description('Vehicle ID')
        }
    }
}

