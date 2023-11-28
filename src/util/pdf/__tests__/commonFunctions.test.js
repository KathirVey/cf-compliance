import {formatLocation, formatDistance, getFormattedTimeFromSeconds, getTimeZoneAbbreviation, formatStartDateTimeForPdf, getEventDetail, getTfmEventRecordStatus, formatStartDateTime, convertUnit} from '../commonFunctions'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import localizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(localizedFormat)

jest.mock('../pdfConfig.js', () => {
    const originalModule = jest.requireActual('../pdfConfig.js')
    return {
        ...originalModule,
        isoLocationMapping: {
            State: {usAbbreviation: 'USAbbr', canadaAbbreviation: 'CanAbbr'}
        }
    }
})

it('should convert units', () => {
    expect(convertUnit(10, 'miles', 1, 'miles')).toEqual({convertedValue: 10, unit: 'mi'})
    expect(convertUnit(10, 'miles', 1, 'kilometers')).toEqual({convertedValue: 16, unit: 'km'})
})

it('should format log event location', () => {
    //When location is not required
    expect(formatLocation({location: {}, eventType: 'Login'})).toEqual('-')
    expect(formatLocation({location: {}, eventType: 'Logout'})).toEqual('-')
    expect(formatLocation({location: {}, eventType: 'StartOfDay'})).toEqual('-')
    expect(formatLocation({location: {}, eventType: 'Exception'})).toEqual('-')    
    expect(formatLocation({location: {}, eventType: 'LogCertification'})).toEqual('-')
    expect(formatLocation({location: {}, eventType: 'MalfunctionDetected'})).toEqual('-')
    expect(formatLocation({location: {}, eventType: 'MalfunctionCleared'})).toEqual('-')
    expect(formatLocation({location: {}, eventType: 'DiagnosticDetected'})).toEqual('-')
    expect(formatLocation({location: {}, eventType: 'DiagnosticCleared'})).toEqual('-')
    expect(formatLocation({location: {}, eventType: 'CycleChanged'})).toEqual('-')
    expect(formatLocation({location: {}, eventType: 'OffDutyDeferral'})).toEqual('-')
    expect(formatLocation({location: {}, eventType: 'AdditionalWorkHours'})).toEqual('-')
    expect(formatLocation({location: {}, eventType: 'Remark'})).toEqual('-')
    expect(formatLocation({location: {}, eventType: 'HosRuleSetModifier'})).toEqual('-')

    //When location is not recorded
    expect(formatLocation({eventType: 'PcYmChange', location: {city: undefined, state: undefined}})).toEqual('- (X, X)')
    expect(formatLocation({eventType: 'EnginePowerUp', location: {city: 'City', state: undefined}})).toEqual('- (X, X)')
    expect(formatLocation({eventType: 'EnginePowerDown', location: {city: undefined, state: 'State'}})).toEqual('- (X, X)')
    
    //When location is manually entered
    expect(formatLocation({
        eventType: 'StatusChange', 
        location: {
            city: 'City', 
            state: 'State'
        }}, 'US', () => ({convertedValue: undefined, unit: 'miles'}))).toEqual('City, USAbbr (M, M)')

    //When location is automatically recorded with GPS
    expect(formatLocation({
        eventType: 'OperatingZoneChanged', 
        location: {
            type: 'Gps', 
            city: 'City', 
            state: 'State', 
            coordinate: {
                latitude: 123.4567890, 
                longitude: -123.4567890
            }, 
            direction: 'NNW', 
            milesFromCity: 5
        }}, 'US', () => ({convertedValue: 5, unit: 'mi'}))).toEqual('5 mi NNW City, USAbbr (123.46, -123.46)')
    
    expect(formatLocation({
        eventType: 'IntermediateLog', 
        location: {
            type: 'Gps', 
            city: 'City', 
            state: 'State', 
            coordinate: {
                latitude: 123.4567890, 
                longitude: -123.4567890
            },
            direction: 'NSW',
            milesFromCity: 5
        }}, 'CAN', () => ({convertedValue: 8, unit: 'km'}))).toEqual('8 km NSW City, CanAbbr (123.46, -123.46)')
})

it('should format distance', () => {
    expect(formatDistance(-1, 'US')).toEqual('Unknown')
    expect(formatDistance(10, 'US')).toEqual('10 mi')
    expect(formatDistance(10, 'CAN')).toEqual('16 km')
})

it('should get formatted time from seconds', () => expect(getFormattedTimeFromSeconds(3661)).toEqual('01:01:01'))

it('should return standard abbreviation', () => {
    const date = '2020-01-01 00:00:00'
    
    expect(getTimeZoneAbbreviation(date, 'America/Halifax')).toEqual('AST')
    expect(getTimeZoneAbbreviation(date, 'America/New_York')).toEqual('EST')
    expect(getTimeZoneAbbreviation(date, 'America/Chicago')).toEqual('CST')
    expect(getTimeZoneAbbreviation(date, 'America/Phoenix')).toEqual('MST')
    expect(getTimeZoneAbbreviation(date, 'America/Los_Angeles')).toEqual('PST')
    expect(getTimeZoneAbbreviation(date, 'America/Anchorage')).toEqual('AKST')
    expect(getTimeZoneAbbreviation(date, 'Pacific/Honolulu')).toEqual('HST')
    expect(getTimeZoneAbbreviation(date, 'America/St_Johns')).toEqual('NST')
    expect(getTimeZoneAbbreviation(date, 'America/Denver')).toEqual('MST')
})

it('should return day light abbreviation', () => {
    const date = '2020-04-01 00:00:00'
    
    expect(getTimeZoneAbbreviation(date, 'America/Halifax')).toEqual('ADT')
    expect(getTimeZoneAbbreviation(date, 'America/New_York')).toEqual('EDT')
    expect(getTimeZoneAbbreviation(date, 'America/Chicago')).toEqual('CDT')
    expect(getTimeZoneAbbreviation(date, 'America/Phoenix')).toEqual('MST')
    expect(getTimeZoneAbbreviation(date, 'America/Los_Angeles')).toEqual('PDT')
    expect(getTimeZoneAbbreviation(date, 'America/Anchorage')).toEqual('AKDT')
    expect(getTimeZoneAbbreviation(date, 'Pacific/Honolulu')).toEqual('HST')
    expect(getTimeZoneAbbreviation(date, 'America/St_Johns')).toEqual('NDT')
    expect(getTimeZoneAbbreviation(date, 'America/Denver')).toEqual('MDT')
})

it('should format start date time for PDF', () => {
    expect(formatStartDateTimeForPdf('2020-01-01 06:00:00', 'America/Chicago', '2020-01-01', true)).toEqual('01/01/20 12:00:00 AM CST')
    expect(formatStartDateTimeForPdf('2020-01-01 08:00:00', 'America/Chicago', '2020-01-01', false)).toEqual('2:00:00 AM CST')
    expect(formatStartDateTimeForPdf('2020-01-01 08:00:00', 'America/Chicago', '2020-01-02', false)).toEqual('01/01/20 2:00:00 AM CST')
})

it('should return event detail for log events list', () => {
    expect(getEventDetail({eventType: 'StatusChange', status: 'Off'})).toEqual('OFF')
    expect(getEventDetail({eventType: 'PcYmChange', pcYmType: 'StartPersonalConveyance'})).toEqual('PC')
    expect(getEventDetail({eventType: 'OperatingZoneChanged'})).toEqual('Change in Operating Zone')
})

it('should return TFM record status', () => {
    expect(getTfmEventRecordStatus('Active')).toEqual('Active')
    expect(getTfmEventRecordStatus('Inactive')).toEqual('Inactive')
    expect(getTfmEventRecordStatus('InactiveChangeRequested')).toEqual('Requested')
    expect(getTfmEventRecordStatus('InactiveChangeRequestedAdd')).toEqual('Requested')
    expect(getTfmEventRecordStatus('InactiveChangeRequestedDelete')).toEqual('Requested')
    expect(getTfmEventRecordStatus('InactiveChangeRejected')).toEqual('Rejected')
})

it('should format start date time', () => expect(formatStartDateTime('2020-01-01 06:00:00', 'America/Chicago')).toEqual('1/1/2020 12:00:00 AM CST'))
