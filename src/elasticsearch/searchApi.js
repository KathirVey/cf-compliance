const client = require('../elasticsearch/client')

const searchApi = {
    upsert: async (index, entity) => {
        const document = {index, type: '_doc', id: entity.id}
        const {body: documentExists} = await client.exists(document)
        if (documentExists) {
            return client.update({
                ...document,
                body: {
                    doc: entity
                }
            })
        } else {
            return client.create({
                ...document,
                body: entity
            })
        }
    },
    delete: async (index, entity) => {
        const document = {index, type: '_doc', id: entity.id}
        const {body: documentExists} = await client.exists(document)
        if (documentExists) return client.delete(document)
    }
}

module.exports = searchApi
