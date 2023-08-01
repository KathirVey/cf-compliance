import {compliance} from '../../../../services'
import route from '../getDriverLogs'

jest.mock('../../../../services')

let request

beforeEach(() => {
    request = {
        auth: {
            artifacts: {
                hasPermission: jest.fn(),
                user: {
                    companyId: 'pfmCid',
                    applicationCustomerId: 'user_ac_id'
                }
            }
        },
        headers: {
            'x-jwt-Assertion': 'access_token',
            'x-application-customer': 'user_ac_id'
        },
        params: {
            driverId: 'test',
            startDateTime: '1234'
        }
    }

})
const driverLog = {
    id: '00000000-0000-0000-0000-000000000000',
    logDate: '2023-03-23',
    driver: {
        id: '00000000-0000-0000-0000-000000000000',
        accountId: '00000000-0000-0000-0000-000000000000',
        username: 'test',
        firstname: 'test',
        lastname: 'test',
        exemptStatus: false,
        licenseNumberRedacted: '****600',
        licenseIssuingStateOrProvince: 'AK'
    },
    shipments: [],
    trailers: [],
    logEvents: [],
    vehicles: [],
    dailySummaryData: {
        multidayBasis: null,
        cycle: null,
        operatingZone: 'Unknown',
        currentOdometerMiles: null,
        currentEngineHours: null,
        currentLocation: null,
        totalHoursInCycle: null,
        remainingHoursInCycle: null,
        totalHoursInWorkshift: null,
        offDutyDeferralStatus: 'None',
        offDutyTimeDeferred: '00:00:00'
    },
    usEldInformation: {
        provider: '',
        identifier: '',
        registrationId: ''
    },
    canadaEldInformation: {
        provider: '',
        identifier: '',
        certificationId: '',
        authentication: ''
    },
    malfunctionsAndDiagnostics: {
        diagnostics: [],
        malfunctions: []
    },
    coDrivers: [],
    startOfDay: '00:00:00',
    timeZone: 'America/Moncton',
    certified: false,
    certifiedTime: null,
    uncertifiedTime: null,
    shortHaulExceptionInUse: false,
    carrier: {
        name: 'Carrier One',
        usdotnumber: '',
        address: {
            addressLine1: '4400 Baker Road',
            addressLine2: '',
            city: 'Minnetonka',
            state: 'Minnesota',
            zip: '55343'
        }
    },
    homeTerminal: {
        name: '*ANewFoundland',
        address: {
            addressLine1: 'address 1',
            addressLine2: '',
            city: 'MN',
            state: 'Minnesota',
            zip: '54631'
        }
    }
}

it('should get driver logs for a driver', async () => {
    compliance.get.mockResolvedValueOnce({
        id: '00000000-0000-0000-0000-000000000000',
        logDate: '2023-03-23',
        driver: {
            id: '00000000-0000-0000-0000-000000000000',
            accountId: '00000000-0000-0000-0000-000000000000',
            username: 'test',
            firstname: 'test',
            lastname: 'test',
            exemptStatus: false,
            licenseNumberRedacted: '****600',
            licenseIssuingStateOrProvince: 'AK'
        },
        shipments: [],
        trailers: [],
        logEvents: [],
        vehicles: [],
        dailySummaryData: {
            multidayBasis: null,
            cycle: null,
            operatingZone: 'Unknown',
            currentOdometerMiles: null,
            currentEngineHours: null,
            currentLocation: null,
            totalHoursInCycle: null,
            remainingHoursInCycle: null,
            totalHoursInWorkshift: null,
            offDutyDeferralStatus: 'None',
            offDutyTimeDeferred: '00:00:00'
        },
        usEldInformation: {
            provider: '',
            identifier: '',
            registrationId: ''
        },
        canadaEldInformation: {
            provider: '',
            identifier: '',
            certificationId: '',
            authentication: ''
        },
        malfunctionsAndDiagnostics: {
            diagnostics: [],
            malfunctions: []
        },
        coDrivers: [],
        startOfDay: '00:00:00',
        timeZone: 'America/Moncton',
        certified: false,
        certifiedTime: null,
        uncertifiedTime: null,
        shortHaulExceptionInUse: false,
        carrier: {
            name: 'Carrier One',
            usdotnumber: '',
            address: {
                addressLine1: '4400 Baker Road',
                addressLine2: '',
                city: 'Minnetonka',
                state: 'Minnesota',
                zip: '55343'
            }
        },
        homeTerminal: {
            name: '*ANewFoundland',
            address: {
                addressLine1: 'address 1',
                addressLine2: '',
                city: 'MN',
                state: 'Minnesota',
                zip: '54631'
            }
        }
    })
    const result = await route.handler(request)
    expect(compliance.get).toHaveBeenCalledWith(`/v2/proxy/driverlogs/test/1234`, {headers: {
        'x-jwt-Assertion': 'access_token',
        'x-application-customer': 'user_ac_id',
        'x-filter-orgid': 'pfmCid'
    }})
    expect(result).toEqual(driverLog)
})

