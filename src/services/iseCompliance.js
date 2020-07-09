import makeService from '@peoplenet/cf-services'
import {logger} from '@peoplenet/node-service-common'

const {iseCompliance: rawIseCompliance, connectedfleetcache} = makeService([
    'iseCompliance',
    'connectedfleetcache'
])

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
                if (!cache.headers) {
                    const pfmOrgId = await getPfmIdForCustomer(headers['x-application-customer'])
                    cache.headers = {
                        'content-type': 'application/json',
                        authorization: `Basic ${process.env.ISE_COMPLIANCE_AUTH}`,
                        'x-authenticate-orgid': 'root',
                        'x-filter-orgid': pfmOrgId
                    }
                }

                return rawIseCompliance[prop].apply(rawIseCompliance, [...args, {headers: cache.headers}])
            }
        }
    })
})()

export default iseCompliance

