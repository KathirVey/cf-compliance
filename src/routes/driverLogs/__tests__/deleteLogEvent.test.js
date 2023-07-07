import {compliance} from '../../../services'
import route from '../deleteLogEvent'

jest.mock('../../../services')
process.env.ISE_COMPLIANCE_AUTH = 'someAuthToken'

let request, iseHeaders

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
            eventKey: 1
        },
        payload: 'test'
    }
    iseHeaders = {
        'content-type': 'application/json',
        authorization: `Basic someAuthToken`,
        'x-authenticate-orgid': 'root',
        'x-filter-orgid': 'pfmCid'
    }    
})

it('should delete log event', async () => {    
    await route.handler(request)
    expect(compliance.post).toHaveBeenCalledWith(`/proxy/logEvents/delete/1`, 'test', {headers: iseHeaders})    
})
