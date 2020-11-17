import iseCompliance from '../iseCompliance'
import {connectedfleetcache, rawIseCompliance} from '../../services'

process.env.ISE_COMPLIANCE_AUTH = 'ISE_COMPLIANCE_AUTH'

jest.mock('../../services')

let headers
beforeEach(() => {
    headers = {
        'x-application-customer': 123456
    }
})

it('should intercept get requests', async () => {
    headers['x-application-customer'] = 1

    connectedfleetcache.get.mockResolvedValueOnce({customer: {companyId: 765}})
    await iseCompliance.get('/some/request', {headers})

    expect(connectedfleetcache.get).toHaveBeenCalledWith('/applicationCustomers/1', {headers})
    expect(rawIseCompliance.get).toHaveBeenCalledWith('/some/request', {headers: {
        authorization: `Basic ISE_COMPLIANCE_AUTH`,
        'content-type': 'application/json',
        'x-authenticate-orgid': 'root',
        'x-filter-orgid': 765
    }})
})

it('should intercept put requests', async () => {
    headers['x-application-customer'] = 2

    const payload = {some: 'payload'}
    connectedfleetcache.get.mockResolvedValueOnce({customer: {companyId: 765}})
    await iseCompliance.put('/some/request', payload, {headers})

    expect(connectedfleetcache.get).toHaveBeenCalledWith('/applicationCustomers/2', {headers})
    expect(rawIseCompliance.put).toHaveBeenCalledWith('/some/request', payload, {headers: {
        authorization: `Basic ISE_COMPLIANCE_AUTH`,
        'content-type': 'application/json',
        'x-authenticate-orgid': 'root',
        'x-filter-orgid': 765
    }})
})

it('should intercept post requests', async () => {
    headers['x-application-customer'] = 3

    const payload = {some: 'payload'}
    connectedfleetcache.get.mockResolvedValueOnce({customer: {companyId: 765}})
    await iseCompliance.post('/some/request', payload, {headers})

    expect(connectedfleetcache.get).toHaveBeenCalledWith('/applicationCustomers/3', {headers})
    expect(rawIseCompliance.post).toHaveBeenCalledWith('/some/request', payload, {headers: {
        authorization: `Basic ISE_COMPLIANCE_AUTH`,
        'content-type': 'application/json',
        'x-authenticate-orgid': 'root',
        'x-filter-orgid': 765
    }})
})

it('should intercept delete requests', async () => {
    headers['x-application-customer'] = 4

    connectedfleetcache.get.mockResolvedValueOnce({customer: {companyId: 765}})
    await iseCompliance.delete('/some/request', {headers})

    expect(connectedfleetcache.get).toHaveBeenCalledWith('/applicationCustomers/4', {headers})
    expect(rawIseCompliance.delete).toHaveBeenCalledWith('/some/request', {headers: {
        authorization: `Basic ISE_COMPLIANCE_AUTH`,
        'content-type': 'application/json',
        'x-authenticate-orgid': 'root',
        'x-filter-orgid': 765
    }})
})

it('should cache headers on x-application-customer', async () => {
    headers['x-application-customer'] = 5

    connectedfleetcache.get.mockResolvedValueOnce({customer: {companyId: 765}})
    await iseCompliance.get('/some/request', {headers})

    expect(connectedfleetcache.get).toHaveBeenCalledWith('/applicationCustomers/5', {headers})
    expect(rawIseCompliance.get).toHaveBeenCalledWith('/some/request', {headers: {
        authorization: `Basic ISE_COMPLIANCE_AUTH`,
        'content-type': 'application/json',
        'x-authenticate-orgid': 'root',
        'x-filter-orgid': 765
    }})

    await iseCompliance.get('/some/request', {headers})

    expect(connectedfleetcache.get).toHaveBeenCalledTimes(1)
    expect(rawIseCompliance.get).toHaveBeenCalledTimes(2)
})
