import Joi from '@hapi/joi'
import searchApi from '../../elasticsearch/searchApi'
import {logger} from '@peoplenet/node-service-common'

export default {
    method: 'POST',
    path: '/kafka/driverSettingsTemplate',
    async handler({payload}, hapi) {
        const {value} = payload
        const {method, payload: entity} = value
        if (method === 'CREATE' || method === 'UPDATE') {
            await searchApi.upsert('driver_settings_template', entity)
        } else if (method === 'DELETE') {
            await searchApi.delete('driver_settings_template', entity)
        }
        logger.info(`Processed Driver settings template ${method} event`, {id: entity.id}) //TODO: Remove this logger info
        return hapi.response().code(204)
    },
    options: {
        description: 'Update search based on driver settings template events',
        tags: ['api'],
        validate: {
            payload: Joi.object().required()
        }
    }
}
