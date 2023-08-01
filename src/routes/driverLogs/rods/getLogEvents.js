const {compliance} = require('../../../services')
import {logger} from '@peoplenet/node-service-common'
import Joi from 'joi'
import {pick} from 'lodash'
import querystring from 'querystring'

const route = {
    method: 'GET',
    path: '/rods/{driverId}/logEvents',
    handler: async ({headers, auth, params, query}, hapi) => {
        const {driverId} = params
        const {user} = auth.artifacts
        const pfmCid = user.companyId

        const queryStrings = {
            ...pick(query, ['startLogDate', 'endLogDate'])
        }

        try {
            return await compliance.get(`/v2/proxy/logEvents/${driverId}?${querystring.stringify(queryStrings)}`, {headers})
        } catch (error) {
            logger.debug(error, pfmCid, 'Encountered error while fetching log events from records-of-duty-status')
            return hapi.response(error.description.data.detail).code(error.description.status)
        }
    },
    options: {
        description: 'rods log events route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-LOGS-READ',
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
