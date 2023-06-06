import {compliance} from '../../../services'
import route from '../getLogEvents'

jest.mock('../../../services')
process.env.ISE_COMPLIANCE_AUTH = 'someAuthToken'

let request, iseHeaders

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
            'x-application-customer': 'user_ac_id'
        },
        params: {
            driverId: 'test'
        },
        query: {
            startLogDate: '2020-01-01',
            endLogDate: '2020-01-10'
        }
    }
    iseHeaders = {
        'content-type': 'application/json',
        authorization: `Basic someAuthToken`,
        'x-authenticate-orgid': 'root',
        'x-filter-orgid': 'pfmCid'
    }
})

const logEvents = [
    {
        eventType: 'StatusChange',
        effectiveAt: '2020-01-01T00:00:00',
        duration: '432000',
        createdAt: '2020-01-01T00:00:00',
        updatedAt: '2020-01-01T00:00:00',
        vehicle: 'testVehicle',
        compliance: {
            sequenceId: 1,
            eldEventType: 1,
            eldEventCode: 1,
            milesSinceLastValidGps: null,
            elapsedEngineHours: null,
            accumulatedVehicleMiles: null,
            diagnostics: false,
            malfunctions: false,
            eventRecordOrigin: 'DriverAddedOrEdited',
            originatorUsername: 'testDriver'
        },
        status: 'Off',
        recordStatus: 'Active',
        location: {
            type: 'Manual',
            city: 'NY',
            state: 'WA'
        },
        annotationList: [],
        eventTypeStatusWithDetails: 'OFF'
    },
    {
        eventType: 'StatusChange',
        effectiveAt: '2020-01-05T00:00:00',
        duration: '432000',
        createdAt: '2020-01-05T00:00:00',
        updatedAt: '2020-01-05T00:00:00',
        vehicle: 'testVehicle',
        compliance: {
            sequenceId: 2,
            eldEventType: 1,
            eldEventCode: 1,
            milesSinceLastValidGps: null,
            elapsedEngineHours: null,
            accumulatedVehicleMiles: null,
            diagnostics: false,
            malfunctions: false,
            eventRecordOrigin: 'DriverAddedOrEdited',
            originatorUsername: 'testDriver'
        },
        status: 'On',
        recordStatus: 'Active',
        location: {
            type: 'Manual',
            city: 'NY',
            state: 'WA'
        },
        annotationList: [],
        eventTypeStatusWithDetails: 'ON'
    }
]

it('should get log events for a driver for given date range', async () => {
    compliance.get.mockResolvedValueOnce([
        {
            eventType: 'StatusChange',
            effectiveAt: '2020-01-01T00:00:00',
            duration: '432000',
            createdAt: '2020-01-01T00:00:00',
            updatedAt: '2020-01-01T00:00:00',
            vehicle: 'testVehicle',
            compliance: {
                sequenceId: 1,
                eldEventType: 1,
                eldEventCode: 1,
                milesSinceLastValidGps: null,
                elapsedEngineHours: null,
                accumulatedVehicleMiles: null,
                diagnostics: false,
                malfunctions: false,
                eventRecordOrigin: 'DriverAddedOrEdited',
                originatorUsername: 'testDriver'
            },
            status: 'Off',
            recordStatus: 'Active',
            location: {
                type: 'Manual',
                city: 'NY',
                state: 'WA'
            },
            annotationList: [],
            eventTypeStatusWithDetails: 'OFF'
        },
        {
            eventType: 'StatusChange',
            effectiveAt: '2020-01-05T00:00:00',
            duration: '432000',
            createdAt: '2020-01-05T00:00:00',
            updatedAt: '2020-01-05T00:00:00',
            vehicle: 'testVehicle',
            compliance: {
                sequenceId: 2,
                eldEventType: 1,
                eldEventCode: 1,
                milesSinceLastValidGps: null,
                elapsedEngineHours: null,
                accumulatedVehicleMiles: null,
                diagnostics: false,
                malfunctions: false,
                eventRecordOrigin: 'DriverAddedOrEdited',
                originatorUsername: 'testDriver'
            },
            status: 'On',
            recordStatus: 'Active',
            location: {
                type: 'Manual',
                city: 'NY',
                state: 'WA'
            },
            annotationList: [],
            eventTypeStatusWithDetails: 'ON'
        }
    ])

    const result = await route.handler(request)
    expect(compliance.get).toHaveBeenCalledWith(`/proxy/logEvents/test?startLogDate=2020-01-01&endLogDate=2020-01-10`, {headers: iseHeaders})
    expect(result).toEqual(logEvents)
})
