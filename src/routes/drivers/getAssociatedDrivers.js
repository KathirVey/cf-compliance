import Joi from 'joi'
import {authHeaders, logger, hasDataLevelAccess} from '@peoplenet/node-service-common'
import {driverService, iseCompliance} from '../../services'
import {stringifyUrl} from 'query-string'
import getIseHeaders from '../../util/getIseHeaders'
import client from '../../elasticsearch/client'
import search from '../../elasticsearch/search'

export default {
    method: 'GET',
    path: '/driversByVehicle/{customerVehicleId}',
    async handler({auth, headers, params, query, server}, hapi) {
        const {customerVehicleId} = params
        const {hoursOfService: getHoursOfService} = query

        const [vehicle] = await search({
            select: ['orgUnitsParentLineage', 'customerIds'],
            from: 'vehicles',
            where: {'customerVehicleId.keyword': customerVehicleId}
        })

        const hasAccess = await hasDataLevelAccess.hasDataLevelAccess({data: vehicle, entityType: 'vehicle', auth})

        if (!hasAccess) return hapi.response([]).code(200)

        const {customerIds: {pfmCid, upsApplicationCustomerId}} = vehicle
        const {_source: appCustomer} = await client.get({index: 'application_customer', id: upsApplicationCustomerId, _source: 'customer.id'})
        const upsCustomerId = appCustomer?.customer.id

        try {
            const iseHeaders = getIseHeaders(pfmCid)
            const iseDrivers = await iseCompliance.get(`/api/vehicles/byVehicleId/${customerVehicleId}/drivers`, {headers: iseHeaders})

            const tfmDrivers = await Promise.all(iseDrivers.map(({driverId}) => {
                const urlPrefix = stringifyUrl({
                    url: `/driver-service/v2/drivers/login/${driverId}`,
                    query: {customerId: upsCustomerId}
                })
                return driverService.get(urlPrefix, {headers})
            }))

            if (!getHoursOfService) return tfmDrivers
            return Promise.all(tfmDrivers.map(async driverResponse => {
                const driver = driverResponse
                const {result: hoursOfService} = await server.inject({
                    headers,
                    method: 'GET',
                    url: stringifyUrl({
                        url: `/drivers/login/${driver?.profile?.loginId}/hoursOfService`,
                        query: {pfmCid, applicationCustomerId: upsApplicationCustomerId, upsCustomerId}
                    })
                })

                return {
                    ...driver,
                    hoursOfService
                }
            }))
        } catch (error) {
            logger.debug(error, 'Encountered error from ISE')
            if (error.description?.status === 404) { // compliance throws an error if there are no assigned drivers
                return []
            }
            logger.error(error, 'Unhandled error from ISE')
            throw error
        }
    },
    options: {
        description: 'Get active drivers for a vehicle',
        tags: ['api'],
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-SERVICE-CUSTOMER-DRIVER-READ',
            overridePermission: ['CXS-CUSTOMER-READ']
        },
        validate: {
            headers: authHeaders,
            params: Joi.object({
                customerVehicleId: Joi.string().required()
            }).required().description('Customer Vehicle ID')
        }
    }
}

