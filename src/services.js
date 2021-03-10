import makeService from '@peoplenet/cf-services'

const {billingDataBridge, driverService, enterpriseData, iseCompliance: rawIseCompliance, connectedfleetcache} = makeService([
    'billingDataBridge',
    'driverService',
    'enterpriseData',
    'iseCompliance',
    'connectedfleetcache'
], {
    customServiceConfig: {
        enterpriseData: {suffix: '/v1'}
    }
})

export {billingDataBridge, enterpriseData, driverService, rawIseCompliance, connectedfleetcache}

