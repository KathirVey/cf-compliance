import {compliance} from '../../../services'
import route from '../getVehicles'

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
        }
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
    
    expect(compliance.get).toHaveBeenCalledWith('/v1/proxy/vehicles', {headers: {
        'x-jwt-Assertion': 'access_token',
        'x-application-customer': 'user_ac_id',
        'x-filter-orgid': 'pfmCid'
    }})
    expect(result).toEqual(vehicles)
})
