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

it('should return correct response when receiving a driver not found error', async () => {
    compliance.get.mockRejectedValue({
        description: {
            status: 404,
            statusText: 'Not Found',
            data: {
                title: 'Not Found',
                status: 404,
                detail: 'Driver with accountId: 00000000-0000-0000-0000-000000000123 and username: testId was not found.'
            }
        }
    })
    const result = await route.handler(request)

    expect(result).toEqual({messageType: 'incorrectAccount'})
})

it('should return correct response when receiving a driver log not found error', async () => {
    compliance.get.mockRejectedValue({
        description: {
            status: 404,
            statusText: 'Not Found',
            data: {
                title: 'Not Found',
                status: 404,
                detail: 'Log Ids for driverId 00000000-0000-0000-0000-000000000123 on 10/06/2023 not found'
            }
        }
    })
    const result = await route.handler(request)

    expect(result).toEqual({messageType: 'noLogs'})
})
