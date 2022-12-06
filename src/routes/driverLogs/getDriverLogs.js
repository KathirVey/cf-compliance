import Joi from 'joi'
import {authHeaders, logger} from '@peoplenet/node-service-common'
import {iseCompliance} from '../../services'
import getIseHeaders from '../../util/getIseHeaders'

const route = {
    method: 'GET',
    path: '/drivers/{driverId}/driverLogs/{startDateTime}',
    async handler({auth, params}) {

        const {driverId, startDateTime} = params
        const {user} = auth.artifacts
        const pfmCid = user.companyId

        try {
            const iseHeaders = getIseHeaders(pfmCid)
            return await iseCompliance.get(`api/v2/DriverLogs/${driverId}?startDateTime=${startDateTime}`, {headers: iseHeaders})

        } catch (error) {
            logger.warn({error, pfmCid, driverId}, 'Error while fetching driver logs.')
        }
    },
    options: {
        description: 'Get a driver log with details',
        tags: ['api'],
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-SERVICE-CUSTOMER-DRIVER-READ',
            overridePermission: ['CXS-CUSTOMER-READ']
        },
        validate: {
            headers: authHeaders,
            params: Joi.object({
                driverId: Joi.string().required(),
                startDateTime: Joi.string().required()
            }).required().description('Driver ID and Start Date')
        }
    }
}


export default route
