const Joi = require('joi')
const searchApi = require('../../elasticsearch/searchApi')
const search = require('../../elasticsearch/search')
const {logger} = require('@peoplenet/node-service-common')

module.exports = {
    method: 'POST',
    path: '/kafka/driver',
    handler: async ({payload}, hapi) => {
        const {value} = payload
        const {method, payload: entity} = value
        const {id} = entity
        if (method === 'CREATE' || method === 'UPDATE') {
            // Find the associated member group
            const [uniqueMemberGroup = {}] = await search({
                select: ['id', 'name', 'description'],
                from: 'driverSettingsTemplates',
                where: {
                    'associations.members.entityId.keyword': id
                }
            })

            //Add member association to corresponding entity payload
            const hydratedEntity = {...entity, uniqueMemberGroup}

            await searchApi.upsert('driver', hydratedEntity)
        } else if (method === 'DELETE') {
            await searchApi.delete('driver', entity)
        }
        logger.info({id: entity.id}, `Processed Driver ${method} event`)
        return hapi.response()
    },
    options: {
        description: 'Update search based on driver events',
        tags: ['api'],
        validate: {
            payload: Joi.object({
                value: Joi.object({
                    method: Joi.string().required(),
                    payload: Joi.object({
                        status: Joi.string().required(),
                        customer: Joi.object({
                            id: Joi.string().required(),
                            companyId: Joi.number().required()
                        }).required(),
                        externalSources: Joi.object().required(),
                        loginInfo: Joi.object().required()
                    })
                })
            }).required().options({allowUnknown: true})
        }
    }
}
