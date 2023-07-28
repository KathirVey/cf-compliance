import {compliance} from '../../../services'
import route from '../getVehicles'

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
        }
    }

    iseHeaders = {
        'content-type': 'application/json',
        authorization: `Basic someAuthToken`,
        'x-authenticate-orgid': 'root',
        'x-filter-orgid': 'pfmCid'
    }
})

const vehicles = [
    {
        id: 123,
        cmvPowerUnitNumber: '1234',
        vin: '1234',
        odometerStart: 100,
        odometerEnd: 105,
        totalDistanceToday: 5
    },
    {
        id: 345,
        cmvPowerUnitNumber: '5678',
        vin: '5678',
        odometerStart: 200,
        odometerEnd: 205,
        totalDistanceToday: 5
    }
]

it('should fetch all the vehicles in an organization', async () => {
    compliance.get.mockResolvedValueOnce([
        {
            id: 123,
            cmvPowerUnitNumber: '1234',
            vin: '1234',
            odometerStart: 100,
            odometerEnd: 105,
            totalDistanceToday: 5
        },
        {
            id: 345,
            cmvPowerUnitNumber: '5678',
            vin: '5678',
            odometerStart: 200,
            odometerEnd: 205,
            totalDistanceToday: 5
        }
    ])
    
    const result = await route.handler(request)
    
    expect(compliance.get).toHaveBeenCalledWith('/proxy/vehicles', {headers: iseHeaders})
    expect(result).toEqual(vehicles)
})
