import Joi from '@hapi/joi'
import {authHeaders} from '@peoplenet/node-service-common'
import {driverService, enterpriseData, iseCompliance} from '../../services'

const getVehicleForDriver = async (loginId, headers) => {
    try {
        const driverVehicle = await iseCompliance.get(`/api/Drivers/byDriverId/${loginId}/vehicle`, {headers})
        const iseVehicle = await iseCompliance.get(`/api/Vehicles/byVehicleId/${driverVehicle.vehicleId}`, {headers})
        const {data} = await enterpriseData.get(`/api/v1/Vehicles/${iseVehicle.assetID}`, {headers})
        return data
    } catch (error) {
        if (error.description?.status === 404) {
            return null
        }
    }
}

export default {
    method: 'GET',
    path: '/drivers/{driverId}',
    async handler({headers, params, server}) {
        const {driverId} = params

        const driver = await driverService.get(`/driver-service/drivers/${driverId}`, {headers})
        const {loginId} = driver.profile

        const [{result: hoursOfService}, vehicle] = await Promise.all([
            server.inject({
                headers,
                method: 'GET',
                url: `/drivers/login/${loginId}/hoursOfService`
            }),
            getVehicleForDriver(loginId, headers)
        ])

        return {
            ...driver,
            vehicle,
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
