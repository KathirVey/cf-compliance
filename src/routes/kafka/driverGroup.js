import Joi from '@hapi/joi'
import searchApi from '../../elasticsearch/searchApi'
import {logger} from '@peoplenet/node-service-common'

export default {
    method: 'POST',
    path: '/kafka/driverGroup',
    async handler({payload}, hapi) {
        const {value} = payload
        const {method, payload: entity} = value
        if (method === 'CREATE' || method === 'UPDATE') {
            await searchApi.upsert('driver_group', entity)
        } else if (method === 'DELETE') {
            await searchApi.delete('driver_group', entity)
        }
        logger.info(`Processed Driver Group ${method} event`, {id: entity.id}) //TODO: Remove this logger info
        return hapi.response().code(204)
    },
    options: {
        description: 'Update search based on driver group events',
        tags: ['api'],
        validate: {
            payload: Joi.object().required()
        }
    }
}
