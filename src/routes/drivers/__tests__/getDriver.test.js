import {driverService, enterpriseData, iseCompliance} from '../../../services'
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
    iseCompliance.get.mockRejectedValue({
        description: {status: 404}
    })
    request.server.inject.mockResolvedValueOnce({result: {shift: 8}})

    const result = await route.handler(request)

    expect(result).toEqual({id: 1, name: 'driver', profile: {loginId: 'konapun'}, hoursOfService: {shift: 8}, vehicle: null})
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/drivers/1', {headers: request.headers})
    expect(request.server.inject).toHaveBeenCalledWith({
        headers: 'xyz',
        method: 'GET',
        url: '/drivers/login/konapun/hoursOfService'
    })
})

it('should get the associated vehicle for a driver', async () => {
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
    iseCompliance.get.mockResolvedValueOnce({vehicleId: '1234'}) // driver vehicle
    iseCompliance.get.mockResolvedValueOnce({assetID: '5678'}) // full vehicle
    enterpriseData.get.mockResolvedValueOnce({data: {id: '90'}})
    request.server.inject.mockResolvedValueOnce({result: {shift: 8}})

    const result = await route.handler(request)

    expect(result).toEqual({id: 1, name: 'driver', profile: {loginId: 'konapun'}, hoursOfService: {shift: 8}, vehicle: {id: '90'}})
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/drivers/1', {headers: request.headers})
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/Drivers/byDriverId/konapun/vehicle', {headers: request.headers})
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/Vehicles/byVehicleId/1234', {headers: request.headers})
    expect(enterpriseData.get).toHaveBeenCalledWith('/api/v1/Vehicles/5678', {headers: request.headers})
    expect(request.server.inject).toHaveBeenCalledWith({
        headers: 'xyz',
        method: 'GET',
        url: '/drivers/login/konapun/hoursOfService'
    })
})
