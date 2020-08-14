import Joi from '@hapi/joi'
import {authHeaders} from '@peoplenet/node-service-common'
import {iseCompliance, driverService} from '../../services'

export default {
    method: 'GET',
    path: '/driversByVehicle/{id}',
    async handler({headers, params, query, server}) {
        const {id} = params
        const {hoursOfService: getHoursOfService} = query

        try {
            const iseDrivers = await iseCompliance.get(`/api/vehicles/byVehicleId/${id}/drivers`, {headers})
            const tfmDrivers = await Promise.all(iseDrivers.map(({driverId}) => driverService.get(`/driver-service/drivers/login/${driverId}`, {headers})))

            if (!getHoursOfService) return tfmDrivers
            return Promise.all(tfmDrivers.map(async driver => {
                const hoursOfService = await server.inject({
                    headers,
                    method: 'GET',
                    url: `/drivers/login/${driver.profile.loginId}/hoursOfService`
                })

                return {
                    ...driver,
                    hoursOfService
                }
            }))
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
            }).required().description('Vehicle ID'),
            query: Joi.object({
                hoursOfService: Joi.boolean().default(false)
            }).required()
        }
    }
}

