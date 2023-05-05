const {createServer, env} = require('@peoplenet/node-service-common')
const {KafkaConsumerPlugin} = require('@peoplenet/node-kafka-common')
const config = require('./kafka/kafkaConfig')

const serve = async () => {
    const server = await createServer({routePath: `${__dirname}/routes`})

    if (env === 'cloud') {
        server.register({
            plugin: KafkaConsumerPlugin,
            options: {config}
        })
    }
}

module.exports = serve()
