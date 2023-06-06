const {compliance} = require('../../services')
import getIseHeaders from '../../util/getIseHeaders'
import {logger} from '@peoplenet/node-service-common'
import Joi from 'joi'
import {pick} from 'lodash'
import querystring from 'querystring'

const route = {
    method: 'GET',
    path: '/drivers/{driverId}/logEvents',
    handler: async ({auth, params, query}, hapi) => {
        const {driverId} = params
        const {user} = auth.artifacts
        const pfmCid = user.companyId

        const queryStrings = {
            ...pick(query, ['startLogDate', 'endLogDate'])
        }

        try {
            const iseHeaders = getIseHeaders(pfmCid)
            const logEvents = await compliance.get(`/proxy/logEvents/${driverId}?${querystring.stringify(queryStrings)}`, {headers: iseHeaders})
            return logEvents

        } catch (error) {
            logger.debug(error, pfmCid, 'Encountered error while fetching log events from ISE')
        }
        return hapi.response().code(200)
    },
    options: {
        description: 'log events route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-SERVICE-CUSTOMER-DRIVER-READ',
            overridePermission: ['CXS-CUSTOMER-READ']
        },
        tags: ['api'],
        validate: {
            params: Joi.object({
                driverId: Joi.string().required()
            }).required().description('Driver ID is required'),
            query: Joi.object({
                startLogDate: Joi.string().required(),
                endLogDate: Joi.string().required()
            }).required().description('Start and End log dates are required')
        }
    }
}

export default route
