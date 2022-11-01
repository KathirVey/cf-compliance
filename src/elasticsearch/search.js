const _ = require('lodash')
const client = require('./client')
const entityToIndex = require('./entityToIndex')
const {convertToElasticQuery} = require('@peoplenet/node-elasticsearch-common')

module.exports = async ({select, from, where, pageSize = 20}) => {
    const elasticQuery = convertToElasticQuery(where)
    elasticQuery.index = entityToIndex[from]
    elasticQuery._source = select
    elasticQuery.size = pageSize
    const {body} = await client.search(elasticQuery)
    return _.map(body.hits.hits, '_source')
}
