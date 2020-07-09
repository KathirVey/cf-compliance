import makeService from '@peoplenet/cf-services'
import iseCompliance from './services/iseCompliance'

const {driverService} = makeService([
    'driverService'
])

export {iseCompliance, driverService}

