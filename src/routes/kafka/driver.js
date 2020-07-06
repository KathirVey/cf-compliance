const Joi = require('@hapi/joi')
const _ = require('lodash')
const searchApi = require('../../elasticsearch/searchApi')

module.exports = {
    method: 'POST',
    path: '/kafka/driver',
    handler: async (request, hapi) => {
        const method = _.lowerCase(request.method)
        const {payload: entity} = request
        if (method === 'create' || method === 'update') {
            await searchApi.upsert('driver', entity)
        } else if (method === 'delete') {
            await searchApi.delete('driver', entity)
        }
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
