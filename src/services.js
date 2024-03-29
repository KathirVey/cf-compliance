const {ENV_PREFIX: env = 'dev'} = process.env
const makeService = require('@peoplenet/cf-services')

const customServiceConfig = {
    ttc: {
        baseURL: {
            dev: 'https://cloud.dev.api.trimblecloud.com/transportation',
            qa: 'https://cloud.dev.api.trimblecloud.com/transportation',
            staging: 'https://cloud.stage.api.trimblecloud.com/transportation',
            prod: 'https://cloud.api.trimble.com/transportation'
        }[env]
    },
    driverService: {k8sNamespace: 'delta'},
    enterpriseData: {suffix: '/v1'},
    iseCompliance: {
        baseURL: {
            local: 'https://compliance-svc-dev.connectedfleet.io/WebApi',
            dev: 'https://compliance-svc-dev.connectedfleet.io/WebApi',
            qa: 'https://compliance-svc-qa.connectedfleet.io/WebApi',
            staging: 'https://compliance-svc-staging.connectedfleet.io/WebApi',
            prod: 'https://compliance-svc.fleethealth.io/WebApi'
        }[env]
    }
}

const services = makeService([
    // TFM services
    'billingDataBridge',
    'connectedfleetcache',

    // Other services
    'ttc',
    'driverService',
    'enterpriseData',
    'iseCompliance'
], {customServiceConfig})

module.exports = services
