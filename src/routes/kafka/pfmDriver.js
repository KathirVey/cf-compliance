const Joi = require('joi')
const searchApi = require('../../elasticsearch/searchApi')
const getCustomerIdFromCid = require('../../util/hydrateCustomerId')
const {logger} = require('@peoplenet/node-service-common')

module.exports = {
    method: 'POST',
    path: '/kafka/pfmDriver',
    handler: async ({payload}, hapi) => {
        const {value} = payload
        const {operation, payload: entity} = value
        entity.id = entity.did
        if (operation.toLowerCase() === 'delete') {
            await searchApi.delete('pfm_driver', entity)
        } else {
            const customerId = await getCustomerIdFromCid(entity.cid)
            if (!customerId) {
                logger.error(`Unable to find customerId for cid: ${entity.cid} in search`)
                return hapi.response()
            }
            entity.customerId = customerId
            const driver = mapper(entity)
            await searchApi.upsert('pfm_driver', driver)
        }
        logger.info({driverId: entity.did}, `Processed driver event`)
        return hapi.response()
    },
    options: {
        description: 'Update search based on pfm_driver events',
        tags: ['api'],
        validate: {
            payload: Joi.object().required()
        }
    }
}

const mapper = payload => {
    return {
        id: payload.id,
        customerId: payload.customerId,
        cid: payload.cid,
        did: payload.did,
        vid: payload.vid,
        active: payload.active,
        name: payload.name,
        idNumber: payload.idNumber, // maps to personId
        termid: payload.termid, // maps to home terminal source key
        created: payload.created,
        deleted: payload.deleted
    }
}
