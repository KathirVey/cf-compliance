import {ttc} from '../../../services'
import route from '../updateCoDrivers'

jest.mock('../../../services')

let request, hapi

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
            driverId: 'test',
            startDateTime: '1234'
        },
        payload: ['codriver01', 'codriver02']
    }

    hapi = {
        response: jest.fn(() => hapi),
        code: jest.fn(() => hapi)
    }    
})

it('should update codrivers for the driver', async () => {    
    await route.handler(request)
    const pay = ['codriver01', 'codriver02']
    expect(ttc.put).toHaveBeenCalledWith(`compliance/v1/proxy/driverlogs/updateCoDrivers/test/1234`, pay, {headers: {
        'x-jwt-Assertion': 'access_token',
        'x-application-customer': 'user_ac_id',
        'x-filter-orgid': 'pfmCid'
    }})    
})

