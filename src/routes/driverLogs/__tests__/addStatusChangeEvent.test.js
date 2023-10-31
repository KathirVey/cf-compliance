import {ttc} from '../../../services'
import route from '../addStatusChangeEvent'

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
            driverId: 'testDriver'
        },
        payload: {}
    }    
})

it('should add status change event', async () => {
    await route.handler(request)
    expect(ttc.post).toHaveBeenCalledWith('compliance/v1/proxy/logEvents/testDriver/status', {}, {headers: {
        'x-jwt-Assertion': 'access_token',
        'x-application-customer': 'user_ac_id',
        'x-filter-orgid': 'pfmCid'
    }})
})
