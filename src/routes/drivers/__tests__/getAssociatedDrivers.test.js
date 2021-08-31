import {driverService} from '../../../services'
import iseCompliance from '../../../services/iseCompliance'
import route from '../getAssociatedDrivers'

jest.mock('../../../services')
    .mock('../../../services/iseCompliance')

let request, hapi

beforeEach(() => {
    request = {
        headers: {
            'x-application-customer': '00-0000-00'
        },
        params: {
            id: 1
        },
        query: {
            hoursOfService: false
        },
        server: {
            inject: jest.fn()
        }
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
    iseCompliance.get.mockResolvedValueOnce([{driverId: 'speed_racer'}, {driverId: 'racer_x'}])
    driverService.get.mockResolvedValueOnce(expectedDriverData[0])
    driverService.get.mockResolvedValueOnce(expectedDriverData[1])

    const drivers = await route.handler(request)

    expect(drivers).toEqual(expectedDriverData)
    expect(iseCompliance.get).toHaveBeenCalledWith(`/api/vehicles/byVehicleId/1/drivers`, {headers: request.headers})
    expect(driverService.get).toHaveBeenCalledTimes(2)
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/v2/drivers/login/speed_racer', {headers: request.headers})
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/v2/drivers/login/racer_x', {headers: request.headers})
})

it('should return an empty array if ISE returns a 404', async () => {
    iseCompliance.get.mockRejectedValue({
        description: {
            status: 404
        }
    })
    const drivers = await route.handler(request)

    expect(drivers).toEqual([])
})

it('should return hours of service data for associated drivers if specified', async () => {
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

    expect(iseCompliance.get).toHaveBeenCalledWith('/api/vehicles/byVehicleId/1/drivers', {headers})
    expect(driverService.get).toHaveBeenCalledTimes(2)
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/v2/drivers/login/speed_racer', {headers})
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/v2/drivers/login/racer_x', {headers})

    expect(server.inject).toHaveBeenCalledTimes(2)
    expect(server.inject).toHaveBeenCalledWith({headers, method: 'GET', url: '/drivers/login/speed_racer/hoursOfService'})
    expect(server.inject).toHaveBeenCalledWith({headers, method: 'GET', url: '/drivers/login/racer_x/hoursOfService'})

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

    request.query = {
        hoursOfService: true,
        customerId: 'someCustId'
    }
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

    iseCompliance.get.mockResolvedValueOnce([{driverId: 'speed_racer'}, {driverId: 'racer_x'}])
    driverService.get.mockResolvedValueOnce(expectedDriverData[0])
    driverService.get.mockResolvedValueOnce(expectedDriverData[1])
    server.inject.mockResolvedValueOnce({result: {availability: {ruleType: 'US'}}})
    server.inject.mockResolvedValueOnce({result: {availability: {ruleType: 'CA'}}})

    const drivers = await route.handler(request)

    expect(iseCompliance.get).toHaveBeenCalledWith(`/api/vehicles/byVehicleId/1/drivers`, {headers: request.headers})

    expect(driverService.get).toHaveBeenCalledTimes(2)
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/v2/drivers/login/speed_racer?customerId=someCustId', {headers: request.headers})
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/v2/drivers/login/racer_x?customerId=someCustId', {headers: request.headers})

    expect(server.inject).toHaveBeenCalledWith({headers, method: 'GET', url: '/drivers/login/speed_racer/hoursOfService'})
    expect(server.inject).toHaveBeenCalledWith({headers, method: 'GET', url: '/drivers/login/racer_x/hoursOfService'})

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
