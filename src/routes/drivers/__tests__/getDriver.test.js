import {driverService, iseCompliance} from '../../../services'
import search from '../../../elasticsearch/search'
import client from '../../../elasticsearch/client'
import route from '../getDriver'

process.env.ISE_COMPLIANCE_AUTH = 'someAuthToken'

jest.mock('@elastic/elasticsearch')
jest.mock('../../../services')
jest.mock('../../../elasticsearch/search')
jest.mock('../../../elasticsearch/client')

let request, iseHeaders
beforeEach(() => {
    request = {
        auth: {
            artifacts: {
                hasPermission: jest.fn()
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
    driverService.get.mockResolvedValue({id: 1, name: 'driver', profile: {loginId: 'konapun'}, customer: {companyId: 'userPfmCid'}})
    iseCompliance.get.mockRejectedValue({
        description: {status: 404}
    })
    request.server.inject.mockResolvedValueOnce({result: {shift: 8}})
    client.get.mockResolvedValueOnce({
        body: {
            _source: {
                orgUnitsParentLineage: [
                    1, 2, 3
                ],
                organizationalUnits: [
                    {id: 'ou1'}, {id: 'ou2'}
                ]
            }
        }
    })
    search.mockResolvedValueOnce([])

    const result = await route.handler(request)

    expect(result).toEqual({
        id: 1,
        name: 'driver',
        profile: {loginId: 'konapun'},
        hoursOfService: {
            shift: 8
        },
        vehicle: null,
        uniqueMemberGroup: null,
        orgUnitsParentLineage: [
            1, 2, 3
        ],
        customer: {companyId: 'userPfmCid'},
        organizationalUnits: [
            {id: 'ou1'}, {id: 'ou2'}
        ]
    })
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/v2/drivers/1', {headers: request.headers})
    expect(request.server.inject).toHaveBeenCalledWith({
        headers: request.headers,
        method: 'GET',
        url: '/drivers/login/konapun/hoursOfService?pfmCid=userPfmCid'
    })
})

it('should get the associated vehicle for a driver', async () => {
    driverService.get.mockResolvedValueOnce({id: 1, name: 'driver', profile: {loginId: 'konapunLeft'}, customer: {companyId: 'userPfmCid'}})
    iseCompliance.get.mockResolvedValueOnce({vehicleId: '1234'}) // driver vehicle
    request.server.inject.mockResolvedValueOnce({result: {shift: 8}})
    search.mockResolvedValueOnce([])
        .mockResolvedValueOnce([{id: 90, devices: []}])
    client.get.mockResolvedValueOnce({
        body: {
            _source: {}
        }
    })

    const result = await route.handler(request)

    expect(result).toEqual({
        id: 1,
        name: 'driver',
        profile: {
            loginId: 'konapunLeft'
        },
        hoursOfService: {
            shift: 8
        },
        customer: {companyId: 'userPfmCid'},
        vehicle: {
            id: 90,
            devices: []
        }, uniqueMemberGroup: null
    })
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/v2/drivers/1', {headers: request.headers})
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/Drivers/byDriverId/konapunLeft/vehicle', {headers: iseHeaders})
    expect(search).toHaveBeenCalledWith({
        select: ['id', 'devices', 'customerVehicleId'],
        from: 'vehicles',
        where: {'customerVehicleId.keyword': '1234', 'customerIds.pfmCid': 'userPfmCid'}
    })
    expect(request.server.inject).toHaveBeenCalledWith({
        headers: request.headers,
        method: 'GET',
        url: '/drivers/login/konapunLeft/hoursOfService?pfmCid=userPfmCid'
    })
})

it('should get the associated driver settings template for a driver', async () => {
    driverService.get.mockResolvedValueOnce({id: 1, name: 'driver', profile: {loginId: 'konapun'}, customer: {companyId: 'userPfmCid'}})
    search.mockResolvedValueOnce([{
        id: 'memberId',
        name: 'memberName',
        description: 'description'
    }])
        .mockResolvedValueOnce([{id: 90, devices: []}])
    iseCompliance.get.mockResolvedValueOnce({vehicleId: '1234'}) // driver vehicle
    request.server.inject.mockResolvedValueOnce({result: {shift: 8}})
    client.get.mockResolvedValueOnce({
        body: {
            _source: {}
        }
    })

    const result = await route.handler(request)

    expect(result).toEqual({
        id: 1,
        name: 'driver',
        customer: {companyId: 'userPfmCid'},
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
        where: {'customerVehicleId.keyword': '1234', 'customerIds.pfmCid': 'userPfmCid'}
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

it('should get a driver for CXSupport', async () => {
    request.auth.artifacts.hasPermission.mockReturnValue(true)
    request.query.scope = 'all'
    driverService.get.mockResolvedValueOnce({id: 1, name: 'driver', profile: {loginId: 'konapunLeft'}, customer: {companyId: 'other_pfm_id', id: 'other_c_id'}})
    iseCompliance.get.mockResolvedValueOnce({vehicleId: '1234'}) // driver vehicle
    request.server.inject.mockResolvedValueOnce({result: {shift: 8}})
    search.mockResolvedValueOnce([])
        .mockResolvedValueOnce([{id: 90, devices: []}])
    client.get
        .mockResolvedValueOnce({
            body: {
                _source: {
                    customer: {
                        id: 'other_c_id'
                    }
                }
            }
        })
        .mockResolvedValueOnce({
            body: {
                _source: {
                    orgUnitsParentLineage: [
                        1, 2, 3
                    ],
                    organizationalUnits: [
                        {id: 'ou1'}, {id: 'ou2'}
                    ]
                }
            }
        })

    const result = await route.handler(request)

    expect(result).toEqual({
        id: 1,
        name: 'driver',
        profile: {
            loginId: 'konapunLeft'
        },
        customer: {companyId: 'other_pfm_id', id: 'other_c_id'},
        hoursOfService: {
            shift: 8
        },
        vehicle: {
            id: 90,
            devices: []
        },
        uniqueMemberGroup: null,
        orgUnitsParentLineage: [
            1, 2, 3
        ],
        organizationalUnits: [
            {id: 'ou1'}, {id: 'ou2'}
        ]
    })
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/v2/drivers/1?customerId=other_c_id', {headers: request.headers})
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/Drivers/byDriverId/konapunLeft/vehicle', {
        headers: {
            ...iseHeaders,
            'x-filter-orgid': 'other_pfm_id'
        }
    })
    expect(search).toHaveBeenCalledWith({
        select: ['id', 'devices', 'customerVehicleId'],
        from: 'vehicles',
        where: {'customerVehicleId.keyword': '1234', 'customerIds.pfmCid': 'other_pfm_id'}
    })
    expect(request.server.inject).toHaveBeenCalledWith({
        headers: request.headers,
        method: 'GET',
        url: '/drivers/login/konapunLeft/hoursOfService?pfmCid=other_pfm_id'
    })
})
