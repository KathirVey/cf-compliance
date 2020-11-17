import {logger} from '@peoplenet/node-service-common'
import {rawIseCompliance, connectedfleetcache} from '../services'

const getPfmIdForCustomer = async applicationCustomerId => {
    try {
        const {customer} = await connectedfleetcache.get(`/applicationCustomers/${applicationCustomerId}`, {headers: {'x-application-customer': applicationCustomerId}})
        return customer.companyId
    } catch (error) {
        logger.error(error, 'Error Translating ED Customer ID to PFM Company ID')
        throw error
    }
}

const iseCompliance = (() => {
    const cache = {}

    return new Proxy(rawIseCompliance, {
        get(target, prop) {
            if (!['get', 'put', 'post', 'patch', 'delete'].includes(prop)) return target[prop]

            return async (...args) => {
                const {headers} = args.pop()
                const applicationCustomer = headers['x-application-customer']
                if (!cache[applicationCustomer]) {
                    const pfmOrgId = await getPfmIdForCustomer(applicationCustomer)
                    cache[applicationCustomer] = {
                        'content-type': 'application/json',
                        authorization: `Basic ${process.env.ISE_COMPLIANCE_AUTH}`,
                        'x-authenticate-orgid': 'root',
                        'x-filter-orgid': pfmOrgId
                    }
                }

                return rawIseCompliance[prop].apply(rawIseCompliance, [...args, {headers: cache[applicationCustomer]}])
            }
        }
    })
})()

export default iseCompliance

