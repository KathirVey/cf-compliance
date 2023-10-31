import {ttc} from '../../../services'
import route from '../deleteLogEvent'

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

it('should delete log event', async () => {    
    await route.handler(request)
    expect(ttc.post).toHaveBeenCalledWith(`compliance/v1/proxy/logEvents/delete/1`, 'test', {headers: {
        'x-jwt-Assertion': 'access_token',
        'x-application-customer': 'user_ac_id',
        'x-filter-orgid': 'pfmCid'
    }})    
})
