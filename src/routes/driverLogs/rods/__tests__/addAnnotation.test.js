import {compliance} from '../../../../services'
import route from '../addAnnotation'

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
        payload: {
            logId: '00000000-0000-0000-0000-000000000123',
            eventId: '00000000-0000-0000-0000-000000000456',
            createdAt: '2023-10-11T10:00:00',
            text: 'test',
            userId: '00000000-0000-0000-0000-000000000789',
            username: 'testUser'
        }
    }
})

const annotationId = [
    {
        annotationId: '00000000-0000-0000-0000-000000001011'
    }
]

it('should post annotation for a log event', async () => {
    compliance.post.mockResolvedValueOnce([{
        annotationId: '00000000-0000-0000-0000-000000001011'
    }])

    const result = await route.handler(request)
    expect(compliance.post).toHaveBeenCalledWith('/v1/driverlogs/events/annotation', request.payload, {headers: {
        'x-jwt-Assertion': 'access_token',
        'x-application-customer': 'user_ac_id'
    }})
    expect(result).toEqual(annotationId)
})
