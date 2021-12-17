const Joi = require('joi')
const searchApi = require('../../elasticsearch/searchApi')
const search = require('../../elasticsearch/search')
const {logger} = require('@peoplenet/node-service-common')

module.exports = {
    method: 'POST',
    path: '/kafka/pfmTerminal',
    handler: async ({payload}, hapi) => {
        const {value} = payload
        const {operation, payload: entity} = value
        entity.id = entity.termid
        if (operation.toLowerCase() === 'delete') {
            await searchApi.delete('pfm_terminal', entity)
        } else {
            const customerId = await getCustomerIdFromCid(entity.cid)
            if (!customerId) {
                logger.error(`Unable to find customerId for cid: ${entity.cid} in search`)
                return hapi.response()
            }
            entity.customerId = customerId
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

const getCustomerIdFromCid = async cid => {
    const [customer] = await search({
        select: ['id'],
        from: 'customers',
        where: {
            pfmId: cid
        }
    })
    return customer?.id
}
