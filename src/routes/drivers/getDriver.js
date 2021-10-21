import Joi from 'joi'
import {authHeaders, logger} from '@peoplenet/node-service-common'
import {driverService} from '../../services'
import iseCompliance from '../../services/iseCompliance'
import {stringifyUrl} from 'query-string'
import search from '../../elasticsearch/search'

const getVehicleForDriver = async (loginId, headers) => {
    try {
        const driverVehicle = await iseCompliance.get(`/api/Drivers/byDriverId/${loginId}/vehicle`, {headers})

        const [vehicle] = await search({
            select: ['id', 'devices', 'customerVehicleId'],
            from: 'vehicles',
            where: {
                'customerVehicleId.keyword': driverVehicle.vehicleId
            }
        })

        if (!vehicle) {
            logger.error(`Unable to find vehicle with customerVehicleId: ${driverVehicle.vehicleId} in search`)
            return null
        }

        return vehicle
    } catch (error) {
        if (error.description?.status === 404) {
            return null
        }
        logger.error(error)
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
    async handler({headers, params, server, query}) {
        const {driverId} = params
        const {customerId} = query

        const url = stringifyUrl({
            url: `/driver-service/v2/drivers/${driverId}`,
            query: {customerId}
        })
        const driver = await driverService.get(url, {headers})
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
        app: {
            permission: 'DRIVER-SERVICE-CUSTOMER-DRIVER-READ',
            overridePermission: ['CXS-CUSTOMER-READ']
        },
        validate: {
            headers: authHeaders,
            params: Joi.object({
                driverId: Joi.string().required()
            }).required().description('Driver ID')
        }
    }
}
