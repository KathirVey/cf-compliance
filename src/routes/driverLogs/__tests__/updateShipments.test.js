import {compliance} from '../../../services'
import route from '../updateShipments'

jest.mock('../../../services')
process.env.ISE_COMPLIANCE_AUTH = 'someAuthToken'

let request, hapi, iseHeaders

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
            driverId: 'test',
            startDateTime: '1234'
        },
        payload: ['shipment01', 'shipment02']
    }

    iseHeaders = {
        'content-type': 'application/json',
        authorization: `Basic someAuthToken`,
        'x-authenticate-orgid': 'root',
        'x-filter-orgid': 'pfmCid'
    }

    hapi = {
        response: jest.fn(() => hapi),
        code: jest.fn(() => hapi)
    }    
})

it('should update shipments for the driver', async () => {    
    await route.handler(request)
    const pay = ['shipment01', 'shipment02']
    expect(compliance.put).toHaveBeenCalledWith(`proxy/driverlogs/updateShipments/test/1234`, pay, {headers: iseHeaders})    
})

