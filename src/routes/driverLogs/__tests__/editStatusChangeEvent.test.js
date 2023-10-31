import {ttc} from '../../../services'
import route from '../editStatusChangeEvent'

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
            driverId: 'testDriver',
            eventKey: 123
        },
        payload: {
            status: 'ON_DUTY',
            city: 'city',
            state: 'AK',
            locationDescription: '',
            cmvPowerUnitNumber: '200',
            reasonForChange: 'reason',
            startDateTime: '2023-08-28T22:00:00'
        }
    }    
})

it('should edit status change event', async () => {
    await route.handler(request)
    expect(ttc.put).toHaveBeenCalledWith('compliance/v1/proxy/logEvents/testDriver/status/123', 
        {
            status: 'ON_DUTY',
            city: 'city',
            state: 'AK',
            locationDescription: '',
            cmvPowerUnitNumber: '200',
            reasonForChange: 'reason',
            startDateTime: '2023-08-28T22:00:00'
        },
        {
            headers: 
            {
                'x-jwt-Assertion': 'access_token',
                'x-application-customer': 'user_ac_id',
                'x-filter-orgid': 'pfmCid'
            }
        })
})
