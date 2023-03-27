import {driverService, iseCompliance} from '../../../services'
import route from '../getAssociatedDrivers'
import client from '../../../elasticsearch/client'
import {mockContext, getSearchContext} from '@peoplenet/node-elasticsearch-common'

process.env.ISE_COMPLIANCE_AUTH = 'someAuthToken'

jest.mock('../../../services')
jest.mock('@peoplenet/node-service-common')
jest.mock('@peoplenet/node-elasticsearch-common')

let request, hapi, iseHeaders

beforeEach(() => {
    request = {
        auth: {
            artifacts: {
                hasPermission: jest.fn(),
                user: {
                    companyId: 'userPfmCid',
                    applicationId: 'a_id',
                    applicationCustomerId: 'user_ac_id',
                    applicationCustomerUserId: 'acu_id'
                }
            }
        },
        headers: {
            'x-application-customer': 'user_ac_id'
        },
        params: {
            customerVehicleId: 1
        },
        query: {
            hoursOfService: false,
            pfmCid: 'queryPfmCid',
            applicationCustomerId: 'query_ac_id',
            scope: 'scoop'
        },
        server: {
            inject: jest.fn()
        }
    }
    iseHeaders = {
        'content-type': 'application/json',
        authorization: `Basic someAuthToken`,
        'x-authenticate-orgid': 'root',
        'x-filter-orgid': 'vehiclePfmCid'
    }

    hapi = {
        response: jest.fn(() => hapi),
        code: jest.fn(() => hapi)
    }

})

it('should support getting drivers associated with a vehicle', async () => {
    const expectedDriverData = [
        {
            id: 1,
            profile: {
                displayName: 'Speed Racer',
                loginId: 'speed_racer'
            }
        },
        {
            id: 2,
            profile: {
                displayName: 'Racer X',
                loginId: 'racer_x'
            }
        }
    ]
    mockContext.search.mockResolvedValueOnce({data: [
        {
            customerIds: {
                pfmCid: 'vehiclePfmCid',
                upsApplicationCustomerId: 'vehicleAppCust'
            },
            orgUnitsParentLineage: [
                1, 2, 3
            ],
            organizationalUnits: [
                {id: 'ou1'}, {id: 'ou2'}
            ]
        }
    ]})
    client.get.mockResolvedValueOnce({
        body: {
            _source: {
                customer: {
                    id: 'c_id'
                }
            }
        }
    })
    iseCompliance.get.mockResolvedValueOnce([{driverId: 'speed_racer'}, {driverId: 'racer_x'}])
    driverService.get.mockResolvedValueOnce(expectedDriverData[0])
    driverService.get.mockResolvedValueOnce(expectedDriverData[1])

    const drivers = await route.handler(request)

    expect(drivers).toEqual(expectedDriverData)
    expect(getSearchContext).toHaveBeenCalledWith({
        applicationCustomerId: 'query_ac_id',
        scope: 'scoop',
        pfmCid: 'queryPfmCid',
        applicationId: 'a_id'
    })
    expect(mockContext.search).toHaveBeenCalledWith({
        applicationCustomerUserId: 'acu_id',
        index: 'vehicle',
        _source: [
            'orgUnitsParentLineage',
            'customerIds'
        ],
        query: {
            'customerVehicleId.keyword': 1
        }
    })
    expect(iseCompliance.get).toHaveBeenCalledWith(`/api/vehicles/byVehicleId/1/drivers`, {headers: iseHeaders})
    expect(driverService.get).toHaveBeenCalledTimes(2)
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/v2/drivers/login/speed_racer?customerId=c_id', {headers: request.headers})
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/v2/drivers/login/racer_x?customerId=c_id', {headers: request.headers})
})

it('should return an empty array if ISE returns a 404', async () => {
    mockContext.search.mockResolvedValueOnce({data: [
        {
            customerIds: {
                pfmCid: 'vehiclePfmCid',
                upsApplicationCustomerId: 'vehicleAppCust'
            },
            orgUnitsParentLineage: [
                1, 2, 3
            ],
            organizationalUnits: [
                {id: 'ou1'}, {id: 'ou2'}
            ]
        }
    ]})
    client.get.mockResolvedValueOnce({
        body: {
            _source: {
                customer: {
                    id: 'c_id'
                }
            }
        }
    })
    iseCompliance.get.mockRejectedValue({
        description: {
            status: 404
        }
    })
    const drivers = await route.handler(request)

    expect(drivers).toEqual([])
})

it('should return hours of service data for associated drivers if specified', async () => {
    mockContext.search.mockResolvedValueOnce({data: [
        {
            customerIds: {
                pfmCid: 'vehiclePfmCid',
                upsApplicationCustomerId: 'vehicleAppCust'
            },
            orgUnitsParentLineage: [
                1, 2, 3
            ],
            organizationalUnits: [
                {id: 'ou1'}, {id: 'ou2'}
            ]
        }
    ]})
    client.get.mockResolvedValueOnce({
        body: {
            _source: {
                customer: {
                    id: 'c_id'
                }
            }
        }
    })
    request.query.hoursOfService = true

    const {headers, server} = request

    const expected = [
        {
            id: 1,
            profile: {
                displayName: 'Speed Racer',
                loginId: 'speed_racer'
            }
        },
        {
            id: 2,
            profile: {
                displayName: 'Racer X',
                loginId: 'racer_x'
            }
        }
    ]

    iseCompliance.get.mockResolvedValueOnce([{driverId: 'speed_racer'}, {driverId: 'racer_x'}])
    driverService.get.mockResolvedValueOnce(expected[0])
    driverService.get.mockResolvedValueOnce(expected[1])
    server.inject.mockResolvedValueOnce({result: {availability: {ruleType: 'US'}}})
    server.inject.mockResolvedValueOnce({result: {availability: {ruleType: 'CA'}}})

    const drivers = await route.handler(request)

    expect(iseCompliance.get).toHaveBeenCalledWith('/api/vehicles/byVehicleId/1/drivers', {headers: iseHeaders})
    expect(driverService.get).toHaveBeenCalledTimes(2)
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/v2/drivers/login/speed_racer?customerId=c_id', {headers})
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/v2/drivers/login/racer_x?customerId=c_id', {headers})

    expect(server.inject).toHaveBeenCalledTimes(2)
    expect(server.inject).toHaveBeenCalledWith({
        headers,
        method: 'GET',
        url: '/drivers/login/speed_racer/hoursOfService?applicationCustomerId=vehicleAppCust&pfmCid=vehiclePfmCid&upsCustomerId=c_id'
    })
    expect(server.inject).toHaveBeenCalledWith({
        headers,
        method: 'GET',
        url: '/drivers/login/racer_x/hoursOfService?applicationCustomerId=vehicleAppCust&pfmCid=vehiclePfmCid&upsCustomerId=c_id'
    })

    expect(drivers).toEqual([
        {
            ...expected[0],
            hoursOfService: {availability: {ruleType: 'US'}}
        },
        {
            ...expected[1],
            hoursOfService: {availability: {ruleType: 'CA'}}
        }
    ])
})

it('should support getting drivers and HOS info for CXSupport', async () => {
    const {server, headers} = request

    request.auth.artifacts.hasPermission.mockReturnValue(true)
    request.query.hoursOfService = true

    const expectedDriverData = [
        {
            id: 1,
            profile: {
                displayName: 'Speed Racer',
                loginId: 'speed_racer'
            }
        },
        {
            id: 2,
            profile: {
                displayName: 'Racer X',
                loginId: 'racer_x'
            }
        }
    ]

    mockContext.search.mockResolvedValueOnce({data: [
        {
            customerIds: {
                pfmCid: 'vehiclePfmCid',
                upsApplicationCustomerId: 'vehicleAppCust'
            },
            orgUnitsParentLineage: [
                1, 2, 3
            ],
            organizationalUnits: [
                {id: 'ou1'}, {id: 'ou2'}
            ]
        }
    ]})
    client.get.mockResolvedValueOnce({
        body: {
            _source: {
                customer: {
                    id: 'c_id'
                }
            }
        }
    })
    iseCompliance.get.mockResolvedValueOnce([{driverId: 'speed_racer'}, {driverId: 'racer_x'}])
    driverService.get.mockResolvedValueOnce(expectedDriverData[0])
    driverService.get.mockResolvedValueOnce(expectedDriverData[1])
    request.server.inject.mockResolvedValueOnce({result: {availability: {ruleType: 'US'}}})
    request.server.inject.mockResolvedValueOnce({result: {availability: {ruleType: 'CA'}}})

    const drivers = await route.handler(request)

    expect(iseCompliance.get).toHaveBeenCalledWith(`/api/vehicles/byVehicleId/1/drivers`, {
        headers: {
            ...iseHeaders,
            'x-filter-orgid': 'vehiclePfmCid'
        }
    })
    expect(driverService.get).toHaveBeenCalledTimes(2)
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/v2/drivers/login/speed_racer?customerId=c_id', {headers})
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/v2/drivers/login/racer_x?customerId=c_id', {headers})

    expect(server.inject).toHaveBeenCalledWith({
        headers,
        method: 'GET',
        url: '/drivers/login/speed_racer/hoursOfService?applicationCustomerId=vehicleAppCust&pfmCid=vehiclePfmCid&upsCustomerId=c_id'
    })
    expect(server.inject).toHaveBeenCalledWith({
        headers,
        method: 'GET',
        url: '/drivers/login/racer_x/hoursOfService?applicationCustomerId=vehicleAppCust&pfmCid=vehiclePfmCid&upsCustomerId=c_id'
    })

    expect(drivers).toEqual([
        {
            id: 1,
            profile: {
                displayName: 'Speed Racer',
                loginId: 'speed_racer'
            },
            hoursOfService: {availability: {ruleType: 'US'}}
        },
        {
            id: 2,
            profile: {
                displayName: 'Racer X',
                loginId: 'racer_x'
            },
            hoursOfService: {availability: {ruleType: 'CA'}}
        }
    ])
})
