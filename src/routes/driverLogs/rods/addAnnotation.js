const {compliance} = require('../../../services')
import {logger} from '@peoplenet/node-service-common'

const route = {
    method: 'POST',
    path: '/rods/logEvents/addAnnotation',
    handler: async ({headers, payload}, hapi) => {
        try {            
            return await compliance.post('/v1/driverlogs/events/annotation', payload, {headers})
        } catch (error) {
            logger.error(error, 'Encountered error while adding annotation to records-of-duty-status')
            return hapi.response(error.description.data).code(error.description.status)
        }
    },
    options: {
        description: 'rods add annotation route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-LOGS-WRITE'            
        },
        tags: ['api']
    }
}

export default route
