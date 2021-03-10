import Joi from 'joi'
import {authHeaders, logger} from '@peoplenet/node-service-common'
import {billingDataBridge, driverService} from '../../services'
import iseCompliance from '../../services/iseCompliance'

export default {
    method: 'GET',
    path: '/driversByVehicle/{id}',
    async handler({headers, params, query, server}) {
        const {id} = params
        const {hoursOfService: getHoursOfService} = query

        const licenses = await billingDataBridge.get('/customerLicenses', {headers})
        const {tidManagedDrivers: isManagedDriver = false} = licenses
        // TODO: v1 path and license check need to be removed when TFM completely switches to managed drivers

        try {
            const iseDrivers = await iseCompliance.get(`/api/vehicles/byVehicleId/${id}/drivers`, {headers})
            logger.debug(iseDrivers, 'Got ISE drivers')

            const urlPrefix = isManagedDriver ? '/driver-service/v2/drivers' : '/driver-service/drivers/login'
            const tfmDrivers = await Promise.all(iseDrivers.map(({driverId}) => driverService.get(`${urlPrefix}/${driverId}`, {headers})))
            logger.debug(tfmDrivers, 'Got TFM drivers')

            if (!getHoursOfService) return tfmDrivers
            return Promise.all(tfmDrivers.map(async driverResponse => {
                const driver = isManagedDriver ? driverResponse : driverResponse?.customerDriver
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

