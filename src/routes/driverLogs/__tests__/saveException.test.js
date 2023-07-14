import {compliance} from '../../../services'
import route from '../saveException'

jest.mock('../../../services')
process.env.ISE_COMPLIANCE_AUTH = 'someAuthToken'

let request, iseHeaders

const payLoad = {
    eventKey: 1, 
    type: 'EMERGENCY', 
    remark: 'test', 
    start: '2023-01-01T06:00:00.000Z',
    reasonForchange: 'test'
}

beforeEach(() => {
    request = {
        auth: {
            artifacts: {
                hasPermission: jest.fn(),
                user: {
                    companyId: 'pfmCid',
                    applicationCustomerId: 'user_ac_id'
                }
            }
        },
        headers: {
            'x-application-customer': 'user_ac_id'
        },
        params: {
            driverId: 'test'
        },
        payload: payLoad
    }
    iseHeaders = {
        'content-type': 'application/json',
        authorization: `Basic someAuthToken`,
        'x-authenticate-orgid': 'root',
        'x-filter-orgid': 'pfmCid'
    }    
})

it('should save exception', async () => {    
    await route.handler(request)
    expect(compliance.put).toHaveBeenCalledWith(`/proxy/driverlogs/saveException/test`, payLoad, {headers: iseHeaders})    
})
