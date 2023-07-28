const {compliance} = require('../../services')
import getIseHeaders from '../../util/getIseHeaders'
import {logger} from '@peoplenet/node-service-common'

const route = {
    method: 'GET',
    path: '/vehicles',
    handler: async ({auth}, hapi) => {
        const {user} = auth.artifacts
        const pfmCid = user.companyId

        try {
            const iseheaders = getIseHeaders(pfmCid)
            const vehiles = await compliance.get('/proxy/vehicles', {headers: iseheaders})
            return vehiles
        } catch (error) {
            logger.debug(error, pfmCid, 'Encountered error while fetching vehicles from ISE')
            return hapi.response(error.description.data).code(error.description.status)
        }
    },
    options: {
        description: 'vehicles route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-SERVICE-CUSTOMER-DRIVER-READ',
            overridePermission: ['CXS-CUSTOMER-READ']
        },
        tags: ['api']
    }
}

export default route
