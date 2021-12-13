const Joi = require('joi')
const searchApi = require('../../elasticsearch/searchApi')
const {logger} = require('@peoplenet/node-service-common')

module.exports = {
    method: 'POST',
    path: '/kafka/pfmTerminal',
    handler: async ({payload: message}, hapi) => {
        const {operation, payload: entity} = message
        entity.id = entity.termid
        if (operation.toLowerCase() === 'delete') {
            await searchApi.delete('pfm_terminal', entity)
        } else {
            await searchApi.upsert('pfm_terminal', entity)
        }
        logger.info({name: entity.name}, `Processed terminal event`)
        return hapi.response()
    },
    options: {
        description: 'Update search based on pfm_terminal events',
        tags: ['api'],
        validate: {
            payload: Joi.object().required()
        }
    }
}
