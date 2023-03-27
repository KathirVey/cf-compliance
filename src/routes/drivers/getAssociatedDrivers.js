import Joi from 'joi'
import {authHeaders, logger} from '@peoplenet/node-service-common'
import {driverService, iseCompliance} from '../../services'
import {stringifyUrl} from 'query-string'
import getIseHeaders from '../../util/getIseHeaders'
import client from '../../elasticsearch/client'
import {getSearchContext} from '@peoplenet/node-elasticsearch-common'

export default {
    method: 'GET',
    path: '/driversByVehicle/{customerVehicleId}',
    async handler({auth, headers, params, query, server}, hapi) {
        const {customerVehicleId} = params
        const {scope, pfmCid, applicationCustomerId, hoursOfService: getHoursOfService} = query
        const {user} = auth.artifacts
        const {applicationId, applicationCustomerUserId} = user

        const searchContext = getSearchContext({applicationId, pfmCid, scope, applicationCustomerId})
        const {data: [vehicle]} = await searchContext.search({
            applicationCustomerUserId,
            _source: ['orgUnitsParentLineage', 'customerIds'],
            index: 'vehicle',
            query: {
                'customerVehicleId.keyword': customerVehicleId
            }
        })
        if (!vehicle) return hapi.response([]).code(200)

        const {customerIds: {pfmCid: pfmId, upsApplicationCustomerId}} = vehicle
        const response = await client.get({
            index: 'application_customer',
            id: upsApplicationCustomerId,
            _source: 'customer.id'
        })
        const upsCustomerId = response?.body?._source?.customer?.id

        try {
            const iseHeaders = getIseHeaders(pfmId)
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
                        query: {pfmCid: pfmId, applicationCustomerId: upsApplicationCustomerId, upsCustomerId}
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

