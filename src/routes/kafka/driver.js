const Joi = require('@hapi/joi')
const searchApi = require('../../elasticsearch/searchApi')
const {logger} = require('@peoplenet/node-service-common')

module.exports = {
    method: 'POST',
    path: '/kafka/driver',
    handler: async ({payload}, hapi) => {
        const {value} = payload
        const {method, payload: entity} = value
        if (method === 'CREATE' || method === 'UPDATE') {
            await searchApi.upsert('driver', entity)
        } else if (method === 'DELETE') {
            await searchApi.delete('driver', entity)
        }
        logger.info(`Processed Driver ${method} event`, {id: entity.id}) //TODO: Remove this logger info
        return hapi.response().code(204)
    },
    options: {
        description: 'Update search based on driver events',
        tags: ['api'],
        validate: {
            payload: Joi.object().required()
        }
    }
}
