import Joi from 'joi'
import {authHeaders, logger} from '@peoplenet/node-service-common'
import {driverService, iseCompliance} from '../../services'
import {stringifyUrl} from 'query-string'
import client from '../../elasticsearch/client'
import search from '../../elasticsearch/search'
import getIseHeaders from '../../util/getIseHeaders'

const route = {
    method: 'GET',
    path: '/drivers/{driverId}',
    async handler({auth, headers, params, server, query}) {
        const {driverId} = params
        const {hasPermission, user} = auth.artifacts
        const {upsCustomerId} = query
        const pfmCid = (hasPermission('CXS-CUSTOMER-READ') ? query.pfmCid : user.companyId) || user.companyId

        const url = stringifyUrl({
            url: `/driver-service/v2/drivers/${driverId}`,
            query: {customerId: upsCustomerId}
        })
        const driver = await driverService.get(url, {headers})
        const {loginId} = driver.profile

        const [{result: hoursOfService}, vehicle, uniqueMemberGroup, hierarchyDetails] = await Promise.all([
            server.inject({
                headers,
                method: 'GET',
                url: `/drivers/login/${loginId}/hoursOfService?pfmCid=${pfmCid}`
            }),
            getVehicleForDriver(loginId, pfmCid),
            getUniqueMemberGroup(driverId),
            getHierarchyDetails(driverId)
        ])

        return {
            ...driver,
            uniqueMemberGroup,
            vehicle,
            hoursOfService,
            ...hierarchyDetails
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

const getHierarchyDetails = async driverId => {
    const {body: {_source: hierarchyDetails}} = await client.get({
        _source: ['orgUnitsParentLineage', 'organizationalUnits'],
        index: 'driver',
        id: driverId
    })
    return hierarchyDetails ?? {}
}

const getVehicleForDriver = async (loginId, pfmCid) => {
    try {
        const iseHeaders = getIseHeaders(pfmCid)
        const driverVehicle = await iseCompliance.get(`/api/Drivers/byDriverId/${loginId}/vehicle`, {headers: iseHeaders})

        const [vehicle] = await search({
            select: ['id', 'devices', 'customerVehicleId'],
            from: 'vehicles',
            where: {
                'customerVehicleId.keyword': driverVehicle.vehicleId,
                'customerIds.pfmCid': pfmCid
            }
        })

        if (!vehicle) {
            logger.error(`Unable to find vehicle with customerVehicleId: ${driverVehicle.vehicleId} in cid: ${pfmCid} in search`)
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

export default route
