import makeService from '@peoplenet/cf-services'
import iseCompliance from './services/iseCompliance'

const {driverService} = makeService([
    'driverService',
    'enterpriseData'
], {
    customServiceConfig: {
        enterpriseData: {suffix: '/v1'}
    }
})

export {iseCompliance, driverService}

