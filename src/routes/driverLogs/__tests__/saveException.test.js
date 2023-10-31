import {ttc} from '../../../services'
import route from '../saveException'

jest.mock('../../../services')

let request

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
            'x-jwt-Assertion': 'access_token',
            'x-application-customer': 'user_ac_id'
        },
        params: {
            driverId: 'test'
        },
        payload: payLoad
    }
})

it('should save exception', async () => {    
    await route.handler(request)
    expect(ttc.put).toHaveBeenCalledWith(`compliance/v1/proxy/driverlogs/saveException/test`, payLoad, {headers: {
        'x-jwt-Assertion': 'access_token',
        'x-application-customer': 'user_ac_id',
        'x-filter-orgid': 'pfmCid'
    }})    
})
