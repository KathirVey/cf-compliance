import Joi from 'joi'
import {authHeaders, logger} from '@peoplenet/node-service-common'
import {driverService, iseCompliance} from '../../services'
import {stringifyUrl} from 'query-string'
import getIseHeaders from '../../util/getIseHeaders'

export default {
    method: 'GET',
    path: '/driversByVehicle/{id}',
    async handler({auth, headers, params, query, server}) {
        const {id} = params
        const {hoursOfService: getHoursOfService} = query
        const {user, hasPermission} = auth.artifacts
        const pfmCid = hasPermission('CXS-CUSTOMER-READ') ? query.pfmCid : user.companyId

        try {
            const iseHeaders = getIseHeaders(pfmCid)
            const iseDrivers = await iseCompliance.get(`/api/vehicles/byVehicleId/${id}/drivers`, {headers: iseHeaders})

            const tfmDrivers = await Promise.all(iseDrivers.map(({driverId}) => {
                const urlPrefix = stringifyUrl({
                    url: `/driver-service/v2/drivers/login/${driverId}`,
                    query: {customerId: pfmCid}
                })
                return driverService.get(urlPrefix, {headers})
            }))

            if (!getHoursOfService) return tfmDrivers
            return Promise.all(tfmDrivers.map(async driverResponse => {
                const driver = driverResponse
                const {result: hoursOfService} = await server.inject({
                    headers,
                    method: 'GET',
                    url: `/drivers/login/${driver?.profile?.loginId}/hoursOfService`
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
                id: Joi.string().required()
            }).required().description('Vehicle ID'),
            query: Joi.object({
                hoursOfService: Joi.boolean().default(false),
                customerId: Joi.string().optional()
            }).required()
        }
    }
}

