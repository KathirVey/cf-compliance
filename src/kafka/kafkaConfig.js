const {
    KAFKA_SCHEMA_REGISTRY_URL,
    KAFKA_BROKER,
    KAFKA_USER,
    KAFKA_PASS,
    KAFKA_RETRY_DELAY_MS = '10000',
    KAFKA_AUTO_COMMIT_INTERVAL = '5000',
    ENV_PREFIX
} = process.env

// See consumption options & defaults here: https://kafka.js.org/docs/consuming#options
// See producing options & defaults here: https://kafka.js.org/docs/producing#options

module.exports = {
    groupId: 'cf-compliance',
    brokers: [KAFKA_BROKER],
    ssl: true,
    sasl: {
        mechanism: 'plain',
        username: KAFKA_USER,
        password: KAFKA_PASS
    },
    schemaRegistry: KAFKA_SCHEMA_REGISTRY_URL,
    messageRetryDelayMS: +KAFKA_RETRY_DELAY_MS,
    autoCommitInterval: +KAFKA_AUTO_COMMIT_INTERVAL,
    consumers: [
        {
            topic: 'aws.transportation.cmd.unique-group.2',
            handlerPath: '/kafka/driverSettingsTemplate',
            handlerMethod: 'POST',
            useSchemaRegistry: true
        }, {
            topic: 'aws.transportation.cmd.managed-driver.0',
            handlerPath: '/kafka/driver',
            handlerMethod: 'POST',
            useSchemaRegistry: true
        }, {
            topic: 'aws.edw.fct.terminal.0',
            handlerPath: '/kafka/pfmTerminal',
            handlerMethod: 'POST'
        }, {
            topic: 'aws.edw.fct.driver.0',
            handlerPath: '/kafka/pfmDriver',
            handlerMethod: 'POST'
        }, {
            enabled: ENV_PREFIX === 'staging' || ENV_PREFIX === 'prod',
            topic: `${ENV_PREFIX}.trimble.transportation.edw.compliance.hours-of-service.qry`,
            handlerPath: '/kafka/driverHoursOfService',
            handlerMethod: 'POST'
        }
    ],
    producers: []
}
