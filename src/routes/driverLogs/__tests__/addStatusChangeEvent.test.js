import {compliance} from '../../../services'
import route from '../addStatusChangeEvent'

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
            driverId: 'testDriver'
        },
        payload: {}
    }
    
    iseHeaders = {
        'content-type': 'application/json',
        authorization: `Basic someAuthToken`,
        'x-authenticate-orgid': 'root',
        'x-filter-orgid': 'pfmCid'
    }    
})

it('should add status change event', async () => {
    await route.handler(request)
    expect(compliance.post).toHaveBeenCalledWith('/proxy/logEvents/testDriver/status', {}, {headers: iseHeaders})
})
