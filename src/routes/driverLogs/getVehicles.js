const {compliance} = require('../../services')
import {logger} from '@peoplenet/node-service-common'

const route = {
    method: 'GET',
    path: '/compliance/vehicles',
    handler: async ({headers, auth}, hapi) => {
        const {user} = auth.artifacts
        const pfmCid = user.companyId

        try {
            const actualHeaders = {
                ...headers,
                'x-filter-orgid': pfmCid
            }
            
            const vehiles = await compliance.get('/v1/proxy/vehicles', {headers: actualHeaders})
            return vehiles
        } catch (error) {
            logger.debug(error, pfmCid, 'Encountered error while fetching vehicles from ISE')
            return hapi.response(error.description.data.detail).code(error.description.status)
        }
    },
    options: {
        description: 'vehicles route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-LOGS-READ',
            overridePermission: ['CXS-CUSTOMER-READ']
        },
        tags: ['api']
    }
}

export default route
