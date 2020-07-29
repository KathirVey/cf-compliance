import Joi from '@hapi/joi'
import {authHeaders} from '@peoplenet/node-service-common'
import {driverService} from '../../services'

export default {
    method: 'GET',
    path: '/drivers/{driverId}',
    async handler({headers, params, server}) {
        const {driverId} = params

        const driver = await driverService.get(`/driver-service/drivers/${driverId}`, {headers})
        const {result: hoursOfService} = await server.inject({
            headers,
            method: 'GET',
            url: `/drivers/login/${driver.profile.loginId}/hoursOfService`
        })

        return {
            ...driver,
            hoursOfService
        }
    },
    options: {
        description: 'Get a driver with hours of service details',
        tags: ['api'],
        auth: 'user-profile',
        app: {permission: 'DRIVER-SERVICE-CUSTOMER-DRIVER-READ'},
        validate: {
            headers: authHeaders,
            params: Joi.object({
                driverId: Joi.string().required()
            }).required().description('Driver ID')
        }
    }
}

