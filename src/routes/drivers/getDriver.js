import Joi from 'joi'
import {authHeaders, logger} from '@peoplenet/node-service-common'
import {driverService, enterpriseData} from '../../services'
import iseCompliance from '../../services/iseCompliance'
import search from '../../elasticsearch/search'

const getVehicleForDriver = async (loginId, headers) => {
    try {
        const driverVehicle = await iseCompliance.get(`/api/Drivers/byDriverId/${loginId}/vehicle`, {headers})
        const devices = await search({
            select: ['vehicle'],
            from: 'devices',
            where: {
                'serialNumber.keyword': driverVehicle.vehicleId
            }
        })
        if (devices.length === 0) {
            logger.error(`Unable to find device with DSN ${driverVehicle.vehicleId} in search`)
            return null
        }
        const device = devices[0]
        const {data: vehicle} = await enterpriseData.get(`vehicles/${device.vehicle.id}`, {headers})
        return vehicle
    } catch (error) {
        logger.error(error)
        if (error.description?.status === 404) {
            return null
        }
    }
}

const getUniqueMemberGroup = async driverId => {
    const [uniqueMemberGroup = null] = await search({
        select: ['id', 'name', 'description'],
        from: 'driverSettingsTemplates',
        where: {
            'associations.members.entityId.keyword': driverId
        }
    })
    return uniqueMemberGroup
}

export default {
    method: 'GET',
    path: '/drivers/{driverId}',
    async handler({headers, params, server}) {
        const {driverId} = params

        const driver = await driverService.get(`/driver-service/drivers/${driverId}`, {headers})
        const {loginId} = driver.profile

        const [{result: hoursOfService}, vehicle, uniqueMemberGroup] = await Promise.all([
            server.inject({
                headers,
                method: 'GET',
                url: `/drivers/login/${loginId}/hoursOfService`
            }),
            getVehicleForDriver(loginId, headers),
            getUniqueMemberGroup(driverId)
        ])

        return {
            ...driver,
            uniqueMemberGroup,
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
