import {compliance} from '../../../../services'
import route from '../getDriverLogs'

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
            driverId: 'test',
            startDateTime: '2023-03-23'
        }
    }
})

it('should get driver logs for a driver', async () => {
    compliance.get.mockResolvedValueOnce({
        id: '00000000-0000-0000-0000-000000000123'
    })
    await route.handler(request)
    expect(compliance.get).toHaveBeenCalledWith(
        'v1/driverlogids/GetIdsByAccountUsernameLogDate?username=test&&logDate=2023-03-23',
        {
            headers: {
                'x-jwt-Assertion': 'access_token',
                'x-application-customer': 'user_ac_id'
            }
        }
    )
    expect(compliance.get).toHaveBeenCalledWith(
        '/v1/driverlogs/00000000-0000-0000-0000-000000000123',
        {
            headers: {
                'x-jwt-Assertion': 'access_token',
                'x-application-customer': 'user_ac_id'
            }
        }
    )
})

