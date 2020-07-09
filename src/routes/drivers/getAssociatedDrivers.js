import Joi from '@hapi/joi'
import {authHeaders} from '@peoplenet/node-service-common'
import {iseCompliance, driverService} from '../../services'

export default {
    method: 'GET',
    path: '/driversByVehicle/{id}',
    async handler({headers, params}) {
        const {id} = params

        try {
            const iseDrivers = await iseCompliance.get(`/api/vehicles/byVehicleId/${id}/drivers`, {headers})
            const tfmDrivers = await Promise.all(iseDrivers.map(({driverId}) => driverService.get(`/driver-service/drivers/login/${driverId}`, {headers})))
            return tfmDrivers
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

