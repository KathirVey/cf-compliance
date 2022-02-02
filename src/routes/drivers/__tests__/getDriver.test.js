import {driverService, iseCompliance} from '../../../services'
import search from '../../../elasticsearch/search'
import route from '../getDriver'

process.env.ISE_COMPLIANCE_AUTH = 'someAuthToken'

jest.mock('@elastic/elasticsearch')
    .mock('../../../services')
    .mock('../../../elasticsearch/search')

let request, iseHeaders
beforeEach(() => {
    request = {
        auth: {
            artifacts: {
                hasPermission: jest.fn(),
                user: {
                    companyId: 'userPfmCid',
                    applicationCustomerId: 'user_ac_id'
                }
            }
        },
        headers: {
            'x-application-customer': 'user_ac_id'
        },
        params: {
            driverId: '1'
        },
        query: {},
        server: {
            inject: jest.fn()
        }
    }
    iseHeaders = {
        'content-type': 'application/json',
        authorization: `Basic someAuthToken`,
        'x-authenticate-orgid': 'root',
        'x-filter-orgid': 'userPfmCid'
    }
})

it('should get a driver with hours of service data', async () => {
    driverService.get.mockResolvedValueOnce({id: 1, name: 'driver', profile: {loginId: 'konapun'}})
    iseCompliance.get.mockRejectedValue({
        description: {status: 404}
    })
    request.server.inject.mockResolvedValueOnce({result: {shift: 8}})
    search.mockResolvedValueOnce([])

    const result = await route.handler(request)

    expect(result).toEqual({id: 1, name: 'driver', profile: {loginId: 'konapun'}, hoursOfService: {shift: 8}, vehicle: null, uniqueMemberGroup: null})
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/v2/drivers/1', {headers: request.headers})
    expect(request.server.inject).toHaveBeenCalledWith({
        headers: request.headers,
        method: 'GET',
        url: '/drivers/login/konapun/hoursOfService?pfmCid=userPfmCid'
    })
})

it('should get the associated vehicle for a driver', async () => {
    driverService.get.mockResolvedValueOnce({id: 1, name: 'driver', profile: {loginId: 'konapunLeft'}})
    iseCompliance.get.mockResolvedValueOnce({vehicleId: '1234'}) // driver vehicle
    request.server.inject.mockResolvedValueOnce({result: {shift: 8}})
    search.mockResolvedValueOnce([])
        .mockResolvedValueOnce([{id: 90, devices: []}])

    const result = await route.handler(request)

    expect(result).toEqual({id: 1, name: 'driver', profile: {loginId: 'konapunLeft'}, hoursOfService: {shift: 8}, vehicle: {id: 90, devices: []}, uniqueMemberGroup: null})
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/v2/drivers/1', {headers: request.headers})
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/Drivers/byDriverId/konapunLeft/vehicle', {headers: iseHeaders})
    expect(search).toHaveBeenCalledWith({
        select: ['id', 'devices', 'customerVehicleId'],
        from: 'vehicles',
        where: {'customerVehicleId.keyword': '1234'}
    })
    expect(request.server.inject).toHaveBeenCalledWith({
        headers: request.headers,
        method: 'GET',
        url: '/drivers/login/konapunLeft/hoursOfService?pfmCid=userPfmCid'
    })
})

it('should get the associated driver settings template for a driver', async () => {
    driverService.get.mockResolvedValueOnce({id: 1, name: 'driver', profile: {loginId: 'konapun'}})
    search.mockResolvedValueOnce([{
        id: 'memberId',
        name: 'memberName',
        description: 'description'
    }])
        .mockResolvedValueOnce([{id: 90, devices: []}])
    iseCompliance.get.mockResolvedValueOnce({vehicleId: '1234'}) // driver vehicle
    request.server.inject.mockResolvedValueOnce({result: {shift: 8}})

    const result = await route.handler(request)

    expect(result).toEqual({
        id: 1,
        name: 'driver',
        profile: {loginId: 'konapun'},
        hoursOfService: {shift: 8},
        vehicle: {id: 90, devices: []},
        uniqueMemberGroup: {id: 'memberId', name: 'memberName', description: 'description'}
    })

    expect(driverService.get).toHaveBeenCalledWith('/driver-service/v2/drivers/1', {headers: request.headers})
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/Drivers/byDriverId/konapun/vehicle', {headers: iseHeaders})
    expect(search).toHaveBeenCalledWith({
        select: ['id', 'devices', 'customerVehicleId'],
        from: 'vehicles',
        where: {'customerVehicleId.keyword': '1234'}
    })
    expect(search).toHaveBeenCalledWith({
        select: ['id', 'name', 'description'],
        from: 'driverSettingsTemplates',
        where: {
            'associations.members.entityId.keyword': '1'
        }
    })
    expect(request.server.inject).toHaveBeenCalledWith({
        headers: request.headers,
        method: 'GET',
        url: '/drivers/login/konapun/hoursOfService?pfmCid=userPfmCid'
    })
})
