import Joi from 'joi'
import {authHeaders, logger} from '@peoplenet/node-service-common'
import {driverService, iseCompliance} from '../../services'
import {stringifyUrl} from 'query-string'
import getIseHeaders from '../../util/getIseHeaders'

export default {
    method: 'GET',
    path: '/driversByVehicle/{customerVehicleId}',
    async handler({auth, headers, params, query, server}) {
        const {customerVehicleId} = params
        const {hoursOfService: getHoursOfService, upsCustomerId} = query
        const {user, hasPermission} = auth.artifacts
        const pfmCid = hasPermission('CXS-CUSTOMER-READ') ? query.pfmCid : user.companyId
        const applicationCustomerId = hasPermission('CXS-CUSTOMER-READ') ? query.applicationCustomerId : user.applicationCustomerId

        try {
            const iseHeaders = getIseHeaders(pfmCid)
            const iseDrivers = await iseCompliance.get(`/api/vehicles/byVehicleId/${customerVehicleId}/drivers`, {headers: iseHeaders})

            const driverServiceHeaders = {
                ...headers,
                'x-application-customer': applicationCustomerId
            }
            const tfmDrivers = await Promise.all(iseDrivers.map(({driverId}) => {
                const urlPrefix = stringifyUrl({
                    url: `/driver-service/v2/drivers/login/${driverId}`,
                    query: {customerId: upsCustomerId}
                })
                return driverService.get(urlPrefix, {headers: driverServiceHeaders})
            }))

            if (!getHoursOfService) return tfmDrivers
            return Promise.all(tfmDrivers.map(async driverResponse => {
                const driver = driverResponse
                const {result: hoursOfService} = await server.inject({
                    headers,
                    method: 'GET',
                    url: stringifyUrl({
                        url: `/drivers/login/${driver?.profile?.loginId}/hoursOfService`,
                        query: {pfmCid, applicationCustomerId, upsCustomerId}
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

