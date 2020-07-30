import {driverService, cfCompliance} from '../../../services'
import route from '../getDriver'

jest.mock('../../../services')

it('should get a driver with hours of service data', async () => {
    const request = {
        headers: 'xyz',
        params: {
            driverId: '1'
        },
        server: {
            inject: jest.fn()
        }
    }

    driverService.get.mockResolvedValueOnce({id: 1, name: 'driver', profile: {loginId: 'konapun'}})
    request.server.inject.mockResolvedValueOnce({result: {shift: 8}})

    const result = await route.handler(request)

    expect(result).toEqual({id: 1, name: 'driver', profile: {loginId: 'konapun'}, hoursOfService: {shift: 8}})
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/drivers/1', {headers: request.headers})
    expect(request.server.inject).toHaveBeenCalledWith({
        headers: 'xyz',
        method: 'GET',
        url: '/drivers/login/konapun/hoursOfService'
    })
})
