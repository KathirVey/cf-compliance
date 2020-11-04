import {driverService, enterpriseData, iseCompliance} from '../../../services'
import search from '../../../elasticsearch/search'
import route from '../getDriver'

jest.mock('../../../services')
jest.mock('@elastic/elasticsearch')
jest.mock('../../../elasticsearch/search')

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
    search.mockResolvedValueOnce([])
    const result = await route.handler(request)
    expect(result).toEqual({id: 1, name: 'driver', profile: {loginId: 'konapun'}, hoursOfService: {shift: 8}, vehicle: null, uniqueMemberGroup: null})
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
    enterpriseData.get.mockResolvedValueOnce({data: {id: 100}}) // vehicles
    request.server.inject.mockResolvedValueOnce({result: {shift: 8}})
    search.mockResolvedValueOnce([])
        .mockResolvedValueOnce([{vehicle: {id: 90}}])

    const result = await route.handler(request)

    expect(result).toEqual({id: 1, name: 'driver', profile: {loginId: 'konapun'}, hoursOfService: {shift: 8}, vehicle: {id: 100}, uniqueMemberGroup: null})
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/drivers/1', {headers: request.headers})
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/Drivers/byDriverId/konapun/vehicle', {headers: request.headers})
    expect(search).toHaveBeenCalledWith({
        select: ['vehicle'],
        from: 'devices',
        where: {'serialNumber.keyword': '1234'}
    })
    expect(enterpriseData.get).toHaveBeenCalledWith('vehicles/90', {headers: request.headers})
    expect(request.server.inject).toHaveBeenCalledWith({
        headers: 'xyz',
        method: 'GET',
        url: '/drivers/login/konapun/hoursOfService'
    })
})

it('should get the associated driver settings template for a driver', async () => {
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
    search.mockResolvedValueOnce([{
        id: 'memberId',
        name: 'memberName',
        description: 'description'
    }])
        .mockResolvedValueOnce([{vehicle: {id: 90}}])
    iseCompliance.get.mockResolvedValueOnce({vehicleId: '1234'}) // driver vehicle
    enterpriseData.get.mockResolvedValueOnce({data: {id: 100}}) // vehicles
    request.server.inject.mockResolvedValueOnce({result: {shift: 8}})

    const result = await route.handler(request)
    expect(result).toEqual({
        id: 1,
        name: 'driver',
        profile: {loginId: 'konapun'},
        hoursOfService: {shift: 8},
        vehicle: {id: 100},
        uniqueMemberGroup: {id: 'memberId', name: 'memberName', description: 'description'}
    })

    expect(driverService.get).toHaveBeenCalledWith('/driver-service/drivers/1', {headers: request.headers})
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/Drivers/byDriverId/konapun/vehicle', {headers: request.headers})
    expect(search).toHaveBeenCalledWith({
        select: ['vehicle'],
        from: 'devices',
        where: {'serialNumber.keyword': '1234'}
    })
    expect(search).toHaveBeenCalledWith({
        select: ['id', 'name', 'description'],
        from: 'driverSettingsTemplates',
        where: {
            'associations.members.entityId.keyword': '1'
        }
    })
    expect(enterpriseData.get).toHaveBeenCalledWith('vehicles/90', {headers: request.headers})
    expect(request.server.inject).toHaveBeenCalledWith({
        headers: 'xyz',
        method: 'GET',
        url: '/drivers/login/konapun/hoursOfService'
    })
})
