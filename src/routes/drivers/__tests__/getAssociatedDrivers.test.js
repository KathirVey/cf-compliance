import {iseCompliance, driverService} from '../../../services'
import route from '../getAssociatedDrivers'

jest.mock('../../../services')

let request, hapi

beforeEach(() => {
    request = {
        headers: {
            'x-application-customer': '00-0000-00'
        },
        params: {
            id: 1
        },
        auth: {
            artifacts: {
                user: {
                    applicationCustomerUsers: [0]
                }
            }
        }
    }

    hapi = {
        response: jest.fn(() => hapi),
        code: jest.fn(() => hapi)
    }
})

it('should get drivers associated with a vehicle', async () => {
    const {headers} = request

    const expected = [
        {
            customerDriver: {
                id: 1
            },
            profile: {
                displayName: 'Speed Racer'
            }
        },
        {
            customerDriver: {
                id: 2
            },
            profile: {
                displayName: 'Racer X'
            }
        }
    ]
    iseCompliance.get.mockResolvedValueOnce([{driverId: 'speed_racer'}, {driverId: 'racer_x'}])
    driverService.get.mockResolvedValueOnce(expected[0])
    driverService.get.mockResolvedValueOnce(expected[1])

    const drivers = await route.handler(request)

    expect(drivers).toEqual(expected)
    expect(iseCompliance.get).toHaveBeenCalledWith(`/api/vehicles/byVehicleId/1/drivers`, {headers})
    expect(driverService.get).toHaveBeenCalledTimes(2)
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/drivers/login/speed_racer', {headers})
    expect(driverService.get).toHaveBeenCalledWith('/driver-service/drivers/login/racer_x', {headers})
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
