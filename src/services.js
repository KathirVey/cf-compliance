import makeService from '@peoplenet/cf-services'

const {driverService, enterpriseData, iseCompliance: rawIseCompliance, connectedfleetcache} = makeService([
    'driverService',
    'enterpriseData',
    'iseCompliance',
    'connectedfleetcache'
], {
    customServiceConfig: {
        enterpriseData: {suffix: '/v1'}
    }
})

export {enterpriseData, driverService, rawIseCompliance, connectedfleetcache}

