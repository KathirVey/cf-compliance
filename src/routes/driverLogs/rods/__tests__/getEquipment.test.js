import {ttc} from '../../../../services'
import route from '../getEquipment'

jest.mock('../../../../services')

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
            customerVehicleId: 123
        }
    }
})

const equipmentId = 100

it('should get equipment id for a customer vehicle id', async () => {
    ttc.get.mockResolvedValueOnce({
        equipmentId: 100
    })

    const result = await route.handler(request)
    expect(ttc.get).toHaveBeenCalledWith('equipment/v1/equipments/equipmentNumber/123', {headers: {
        'x-jwt-Assertion': 'access_token',
        'x-application-customer': 'user_ac_id'
    }})
    expect(result).toEqual(equipmentId)
})
