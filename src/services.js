const {ENV_PREFIX: env = 'dev'} = process.env
const makeService = require('@peoplenet/cf-services')

const customServiceConfig = {
    compliance: {
        baseURL: {
            dev: 'https://complianceefsmigrationefsmigrationproxy.dev.trimble-transportation.com/compliance/v1',
            qa: 'https://complianceefsmigrationefsmigrationproxy.dev.trimble-transportation.com/compliance/v1',
            staging: 'https://complianceefsmigrationefsmigrationproxy.dev.trimble-transportation.com/compliance/v1',
            prod: ''
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
        }
    }
}

const services = makeService([
    // TFM services
    'billingDataBridge',
    'connectedfleetcache',

    // Other services
    'compliance',
    'driverService',
    'enterpriseData',
    'iseCompliance'
], {customServiceConfig})

module.exports = services
