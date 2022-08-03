const {ENV_PREFIX: env = 'dev'} = process.env
const makeService = require('@peoplenet/cf-services')

const customServiceConfig = {
    enterpriseData: {suffix: '/v1'},
    compliance: {
        baseURL: {
            dev: 'https://cloud.dev.api.trimblecloud.com/transportation/compliance/v1',
            staging: 'https://cloud.stage.api.trimblecloud.com/transportation/compliance/v1',
            prod: ''
        }[env]
    }
}

const services = makeService([
    'billingDataBridge',
    'compliance',
    'connectedfleetcache',
    'driverService',
    'enterpriseData',
    'iseCompliance'
], {customServiceConfig})

module.exports = services
