import {compliance} from '../../../services'
import route from '../deleteException'

jest.mock('../../../services')

let request

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
            eventKey: 1
        },
        payload: 'test'
    }
})

it('should delete exception', async () => {    
    await route.handler(request)
    expect(compliance.post).toHaveBeenCalledWith(`/v1/proxy/driverlogs/deleteException/1`, 'test', {headers: {
        'x-jwt-Assertion': 'access_token',
        'x-application-customer': 'user_ac_id',
        'x-filter-orgid': 'pfmCid'
    }})    
})
