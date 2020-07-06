const {getElasticsearchClient} = require('@peoplenet/node-service-common')
const elasticsearch = require('@elastic/elasticsearch')

module.exports = getElasticsearchClient(elasticsearch)
