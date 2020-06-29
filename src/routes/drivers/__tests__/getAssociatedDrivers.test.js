import {iseCompliance} from '../../../services'
import route from '../getAssociatedDrivers'

jest.mock('../../../services')

const setup = id => {
    const request = {
        headers: {
            'x-application-customer': '00-0000-00'
        },
        params: {
            id
        },
        auth: {
            artifacts: {
                user: {
                    applicationCustomerUsers: [0]
                }
            }
        }
    }
    const hapi = {
        response: jest.fn(() => hapi),
        code: jest.fn(() => hapi)
    }

    iseCompliance.get.mockClear()
    return {request, hapi}
}

it('should get drivers associated with a vehicle', async () => {
    const {request} = setup(1)
    const {headers} = request

    const expected = [{name: 'Speed Racer'}, {name: 'Racer X'}]

    iseCompliance.get.mockResolvedValue(expected)
    const drivers = await route.handler(request)

    expect(drivers).toEqual(expected)
    expect(iseCompliance.get).toHaveBeenCalledWith(`/api/vehicles/byVehicleId/1/drivers`, {headers})
})

it('should return an empty array if ISE returns a 404', async () => {
    const {request} = setup(1)

    iseCompliance.get.mockRejectedValue({
        description: {
            status: 404
        }
    })
    const drivers = await route.handler(request)

    expect(drivers).toEqual([])
})

