const {createServer, env, tracer} = require('@peoplenet/node-service-common')
const {KafkaConsumerPlugin} = require('@peoplenet/node-kafka-common')
const config = require('./kafka/kafkaConfig')

const serve = async () => {
    const server = await createServer({routePath: `${__dirname}/routes`})

    if (env === 'cloud') {
        // Disabling this plugin as it's broken for consuming Avro topics
        tracer.user('kafkajs', false)

        server.register({
            plugin: KafkaConsumerPlugin,
            options: {config}
        })
    }
}

module.exports = serve()
