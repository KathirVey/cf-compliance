import {iseCompliance} from '../../../services'
import route from '../getHoursOfService'

process.env.ISE_COMPLIANCE_AUTH = 'someAuthToken'

jest.mock('../../../services')

let request, iseHeaders

beforeEach(() => {
    request = {
        auth: {
            artifacts: {
                hasPermission: jest.fn(),
                user: {
                    companyId: 'userPfmCid'
                }
            }
        },
        query: {
            pfmCid: 'queryPfmCid'
        },
        headers: {
            'x-application-customer': '00-0000-00'
        },
        params: {
            loginId: 'konapun'
        }
    }
    iseHeaders = {
        'content-type': 'application/json',
        authorization: `Basic someAuthToken`,
        'x-authenticate-orgid': 'root',
        'x-filter-orgid': 'userPfmCid'
    }
})

it('should get hours of service info for a driver', async () => {
    request.query.startDateTime = 1234
    iseCompliance.get.mockResolvedValueOnce({ // availability
        availableByRule: [{
            ruleType: 'US',
            availability: {
                workshiftDrivingTime: 40,
                workshiftDutyTime: 50,
                cycleDutyTime: 60,
                workshiftRestBreakTime: 30,
                overallDrivingTime: 40,
                overallDutyTime: 50
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

    const result = await route.handler(request)

    expect(iseCompliance.get).toHaveBeenCalledTimes(2)
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/DriverLogs/availability/byDriverId/konapun', {headers: iseHeaders})
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/v2/DriverLogs/certificationStatus?startDateTime=1234&driverId=konapun', {headers: iseHeaders})

    expect(result).toEqual({
        availability: [{
            ruleType: 'US',
            cycleDutyTime: 60,
            cycleOnDutyMaximumTime: 90,
            workshiftDrivingMaximumTime: 70,
            workshiftDrivingTime: 40,
            workshiftDutyTime: 50,
            workshiftOnDutyMaximumTime: 80,
            workshiftRestBreakTime: 30,
            workshiftRestBreakMaximumOnDutyTime: 100,
            overallDrivingTime: 40,
            overallDutyTime: 50,
            overallDrivingTimeConstraint: null,
            overallDutyTimeConstraint: null
        }],
        certification: [{c: 3}]
    })
})

it('should constrain drive time by duty time if duty time is less than drive time', async () => {
    request.query.startDateTime = 1234
    iseCompliance.get.mockResolvedValueOnce({
        availableByRule: [{
            ruleType: 'US',
            availability: {
                workshiftDrivingTime: 60,
                workshiftDutyTime: 50,
                cycleDutyTime: 55,
                workshiftRestBreakTime: 30,
                workshiftRestBreakEnabled: true,
                overallDrivingTime: 50,
                overallDutyTime: 50
            },
            ruleSet: {
                workshiftDrivingMaximumTime: 70,
                workshiftOnDutyMaximumTime: 80,
                cycleOnDutyMaximumTime: 90,
                workshiftRestBreakMaximumOnDutyTime: 100
            }
        }]
    })
    iseCompliance.get.mockResolvedValueOnce([{c: 3}])

    const result = await route.handler(request)

    expect(iseCompliance.get).toHaveBeenCalledTimes(2)
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/DriverLogs/availability/byDriverId/konapun', {headers: iseHeaders})
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/v2/DriverLogs/certificationStatus?startDateTime=1234&driverId=konapun', {headers: iseHeaders})

    expect(result).toEqual({
        availability: [{
            ruleType: 'US',
            cycleDutyTime: 55,
            cycleOnDutyMaximumTime: 90,
            workshiftDrivingMaximumTime: 70,
            workshiftDrivingTime: 60,
            workshiftDutyTime: 50,
            workshiftOnDutyMaximumTime: 80,
            workshiftRestBreakTime: 30,
            workshiftRestBreakMaximumOnDutyTime: 100,
            overallDrivingTime: 50,
            overallDutyTime: 50,
            overallDrivingTimeConstraint: 'workshiftDutyTime',
            overallDutyTimeConstraint: null
        }],
        certification: [{c: 3}]
    })
})

it('should constrain drive time and duty time by cycle time if cycle time is less than drive time', async () => {
    request.query.startDateTime = 1234
    iseCompliance.get.mockResolvedValueOnce({ // availability
        availableByRule: [{
            ruleType: 'US',
            availability: {
                workshiftDrivingTime: 60,
                workshiftDutyTime: 70,
                cycleDutyTime: 50,
                workshiftRestBreakTime: 30,
                workshiftRestBreakEnabled: true,
                overallDrivingTime: 50,
                overallDutyTime: 50
            },
            ruleSet: {
                workshiftDrivingMaximumTime: 70,
                workshiftOnDutyMaximumTime: 80,
                cycleOnDutyMaximumTime: 90,
                workshiftRestBreakMaximumOnDutyTime: 100
            }
        }]
    })
    iseCompliance.get.mockResolvedValueOnce([{c: 3}])

    const result = await route.handler(request)

    expect(iseCompliance.get).toHaveBeenCalledTimes(2)
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/DriverLogs/availability/byDriverId/konapun', {headers: iseHeaders})
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/v2/DriverLogs/certificationStatus?startDateTime=1234&driverId=konapun', {headers: iseHeaders})

    expect(result).toEqual({
        availability: [{
            ruleType: 'US',
            cycleDutyTime: 50,
            cycleOnDutyMaximumTime: 90,
            workshiftDrivingMaximumTime: 70,
            workshiftDrivingTime: 60,
            workshiftDutyTime: 70,
            workshiftOnDutyMaximumTime: 80,
            workshiftRestBreakTime: 30,
            workshiftRestBreakMaximumOnDutyTime: 100,
            overallDrivingTime: 50,
            overallDutyTime: 50,
            overallDrivingTimeConstraint: 'cycleDutyTime',
            overallDutyTimeConstraint: 'cycleDutyTime'
        }],
        certification: [{c: 3}]
    })
})

it('should constrain drive time by break time if the driver requires a mandatory break', async () => {
    request.query.startDateTime = 1234
    iseCompliance.get.mockResolvedValueOnce({ // availability
        availableByRule: [{
            ruleType: 'US',
            availability: {
                workshiftDrivingTime: 60,
                workshiftDutyTime: 70,
                cycleDutyTime: 50,
                workshiftRestBreakTime: 30,
                overallDrivingTime: 30,
                overallDutyTime: 70,
                workshiftRestBreakEnabled: true
            },
            ruleSet: {
                workshiftDrivingMaximumTime: 70,
                workshiftOnDutyMaximumTime: 80,
                cycleOnDutyMaximumTime: 90,
                workshiftRestBreakMaximumOnDutyTime: 100
            }
        }]
    })
    iseCompliance.get.mockResolvedValueOnce([{c: 3}])

    const result = await route.handler(request)

    expect(iseCompliance.get).toHaveBeenCalledTimes(2)
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/DriverLogs/availability/byDriverId/konapun', {headers: iseHeaders})
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/v2/DriverLogs/certificationStatus?startDateTime=1234&driverId=konapun', {headers: iseHeaders})

    expect(result).toEqual({
        availability: [{
            ruleType: 'US',
            cycleDutyTime: 50,
            cycleOnDutyMaximumTime: 90,
            workshiftDrivingMaximumTime: 70,
            workshiftDrivingTime: 60,
            workshiftDutyTime: 70,
            workshiftOnDutyMaximumTime: 80,
            workshiftRestBreakTime: 30,
            workshiftRestBreakMaximumOnDutyTime: 100,
            overallDrivingTime: 30,
            overallDutyTime: 70,
            overallDrivingTimeConstraint: 'workshiftRestBreakTime',
            overallDutyTimeConstraint: null
        }],
        certification: [{c: 3}]
    })
})

it('should pick a default start date of one week ago if not provided', async () => {
    await route.handler(request)

    expect(iseCompliance.get).toHaveBeenCalledWith('/api/v2/DriverLogs/certificationStatus?startDateTime=1999-12-26T03%3A04%3A05.006Z&driverId=konapun', {headers: iseHeaders})
})

it('should give an empty array for availability and ceritifcation if no data is found', async () => {
    request.query.startDateTime = 1234
    iseCompliance.get.mockResolvedValueOnce() // availability
    iseCompliance.get.mockResolvedValueOnce() // certification

    const result = await route.handler(request)

    expect(iseCompliance.get).toHaveBeenCalledTimes(2)
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/DriverLogs/availability/byDriverId/konapun', {headers: iseHeaders})
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/v2/DriverLogs/certificationStatus?startDateTime=1234&driverId=konapun', {headers: iseHeaders})

    expect(result).toEqual({availability: [], certification: []})
})

it('should handle 404s from ISE', async () => {
    request.query.startDateTime = 1234
    iseCompliance.get.mockRejectedValueOnce({description: {status: 404}})
    iseCompliance.get.mockResolvedValueOnce([{c: 3}]) // certification

    const result = await route.handler(request)

    expect(iseCompliance.get).toHaveBeenCalledTimes(2)
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/DriverLogs/availability/byDriverId/konapun', {headers: iseHeaders})
    expect(iseCompliance.get).toHaveBeenCalledWith('/api/v2/DriverLogs/certificationStatus?startDateTime=1234&driverId=konapun', {headers: iseHeaders})

    expect(result).toEqual({
        availability: [],
        certification: []
    })
})
