import iseCompliance from '../../../services/iseCompliance'
import route from '../getHoursOfService'

jest.mock('../../../services')
    .mock('../../../services/iseCompliance')

let request

beforeEach(() => {
    request = {
        query: {},
        headers: {
            'x-application-customer': '00-0000-00'
        },
        params: {
            loginId: 'konapun'
        }
    }
})

it('should get hours of service info for a driver', async () => {
    request.query.startDateTime = 1234
    iseCompliance.get.mockResolvedValueOnce({ // availability
        availableByRule: [{
            ruleType: 'US',
            availability: {
                workshiftDrivingTime: 60,
                workshiftDutyTime: 50,
                cycleDutyTime: 40,
                workshiftRestBreakTime: 30
            },
            ruleSet: {
                workshiftDrivingMaximumTime: 70,
                workshiftOnDutyMaximumTime: 80,
                cycleOnDutyMaximumTime: 90,
                workshiftRestBreakMaximumOnDutyTime: 100
            }
        }]
    })
    iseCompliance.get.mockResolvedValueOnce([{c: 3}]) // certification

    const {headers} = request
    const result = await route.handler(request)

    expect(iseCompliance.get).toHaveBeenCalledTimes(2)
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/DriverLogs/availability/byDriverId/konapun', {headers})
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/v2/DriverLogs/certificationStatus?startDateTime=1234&driverId=konapun', {headers})

    expect(result).toEqual({
        availability: [{
            ruleType: 'US',
            cycleDutyTime: 40,
            cycleOnDutyMaximumTime: 90,
            workshiftDrivingMaximumTime: 70,
            workshiftDrivingTime: 60,
            workshiftDutyTime: 50,
            workshiftOnDutyMaximumTime: 80,
            workshiftRestBreakTime: 30,
            workshiftRestBreakMaximumOnDutyTime: 100
        }],
        certification: [{c: 3}]
    })
})

it('should pick a default start date of one week ago if not provided', async () => {
    const {headers} = request

    await route.handler(request)

    expect(iseCompliance.get).toHaveBeenCalledWith('/api/v2/DriverLogs/certificationStatus?startDateTime=1999-12-26T03%3A04%3A05.006Z&driverId=konapun', {headers})
})

it('should give an empty array for availability and ceritifcation if no data is found', async () => {
    request.query.startDateTime = 1234
    iseCompliance.get.mockResolvedValueOnce() // availability
    iseCompliance.get.mockResolvedValueOnce() // certification

    const {headers} = request
    const result = await route.handler(request)

    expect(iseCompliance.get).toHaveBeenCalledTimes(2)
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/DriverLogs/availability/byDriverId/konapun', {headers})
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/v2/DriverLogs/certificationStatus?startDateTime=1234&driverId=konapun', {headers})

    expect(result).toEqual({availability: [], certification: []})
})

it('should handle 404s from ISE', async () => {
    request.query.startDateTime = 1234
    iseCompliance.get.mockRejectedValueOnce({description: {status: 404}})
    iseCompliance.get.mockResolvedValueOnce([{c: 3}]) // certification

    const {headers} = request
    const result = await route.handler(request)

    expect(iseCompliance.get).toHaveBeenCalledTimes(2)
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/DriverLogs/availability/byDriverId/konapun', {headers})
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/v2/DriverLogs/certificationStatus?startDateTime=1234&driverId=konapun', {headers})

    expect(result).toEqual({
        availability: [],
        certification: []
    })
})
