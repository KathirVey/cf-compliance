import dayjs from 'dayjs'
import {round, isNumber} from 'lodash'
import {eventTypes, isoLocationMapping, dutyStatusAbbreviation, specialConditionsAbbreviation} from './pdfConfig'

export const convertUnit = (value, inputUnit, decimals = 2, toUnit) => {
    const units = {
        miles: 'mi',
        kilometers: 'km'
    }

    const unitConversion = [
        {from: 'miles', to: 'kilometers', convert: input => input * 1.60934},
        {from: 'kilometers', to: 'miles', convert: input => input * 0.621371}
    ]

    if (inputUnit === toUnit) {
        return {
            convertedValue: round(value, decimals),
            unit: units[inputUnit]
        }
    }

    const {convert} = unitConversion.find(unit => unit.from === inputUnit && unit.to === toUnit)
    const convertedValue = isNumber(value) && convert ? convert(value) : undefined

    return {
        convertedValue: Math.round(convertedValue, decimals),
        unit: units[toUnit]
    }
}

export const formatLocation = ({location, eventType}, flag) => {
    if (eventTypes[eventType] !== eventTypes.StatusChange && eventTypes[eventType] !== eventTypes.PcYmChange && 
        eventTypes[eventType] !== eventTypes.EnginePowerUp && eventTypes[eventType] !== eventTypes.EnginePowerDown && 
        eventTypes[eventType] !== eventTypes.OperatingZoneChanged && eventTypes[eventType] !== eventTypes.IntermediateLog) {
        return '-'
    }

    const {type, city, state, coordinate, direction, milesFromCity} = location

    if (!city || !state) return '- (X, X)'

    const {convertedValue, unit} = convertUnit(milesFromCity, 'miles', 1, flag === 'US' ? 'miles' : 'kilometers')
    const distance = (convertedValue || convertedValue >= 0) ? `${convertedValue} ${unit}` : ''
    const stateAbbreviation = flag === 'US' ? isoLocationMapping[state].usAbbreviation : isoLocationMapping[state].canadaAbbreviation

    const locationDescription = `${distance} ${direction || ''} ${city}, ${stateAbbreviation}`.trim()
    return type === 'Gps' ? `${locationDescription} (${round(coordinate.latitude, 2).toFixed(2)}, ${round(coordinate.longitude, 2).toFixed(2)})` : `${locationDescription} (M, M)`
}

export const formatDistance = (value, flag) => {
    if (value < 0) {
        return '-'
    }

    const outputUnit = flag === 'US' ? 'miles' : 'kilometers'

    const {convertedValue, unit} = convertUnit(value, 'miles', 1, outputUnit)
    return convertedValue || convertedValue >= 0 ? `${convertedValue} ${unit}` : '-'
}

export const getFormattedTimeFromSeconds = seconds => {
    const hours = seconds >= 3600 ? Math.floor(seconds / 3600) : 0
    seconds = seconds % 3600
    const minutes = seconds >= 60 ? Math.floor(seconds / 60) : 0
    seconds = seconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export const getTimeZoneAbbreviation = (date, timeZone) => {
    const options = {
        timeZone,
        timeZoneName: 'short'
    }

    const timeZoneAbbreviation = new Intl.DateTimeFormat('en-CA', options)
        .formatToParts(new Date(date))
        .find(part => part.type === 'timeZoneName')
        .value
    
    return timeZoneAbbreviation
}

export const formatStartDateTimeForPdf = (value, timeZone, logDate, isFirstEventForTheday = false) => {    
    const startDateTime = dayjs.tz(value, 'UTC').tz(timeZone)

    if (isFirstEventForTheday || startDateTime.format('YYYY-MM-DD') !== logDate) {
        return `${startDateTime.format('MM/DD/YY LTS')} ${getTimeZoneAbbreviation(startDateTime, timeZone)}`
    }

    return `${startDateTime.format('LTS')} ${getTimeZoneAbbreviation(startDateTime, timeZone)}`
}

export const getEventDetail = logEvent => {
    if (logEvent.eventType === 'StatusChange') {
        return dutyStatusAbbreviation[logEvent.status]
    } else if (logEvent.eventType === 'PcYmChange') {
        return specialConditionsAbbreviation[logEvent.pcYmType]
    } else {
        return eventTypes[logEvent.eventType]
    }
}

export const getTfmEventRecordStatus = status => {
    switch (status) {
        case 'Active':
            return 'Active'
        case 'Inactive':
            return 'Inactive'
        case 'InactiveChangeRequested':
        case 'InactiveChangeRequestedAdd':
        case 'InactiveChangeRequestedDelete':
            return 'Requested'
        case 'InactiveChangeRejected':
            return 'Rejected'
        default:
            return null
    }
}

export const formatStartDateTime = (value, timeZone) => {
    const startDateTime = dayjs.tz(value, 'UTC').tz(timeZone)
    return `${startDateTime.format('l LTS')} ${getTimeZoneAbbreviation(startDateTime, timeZone)}`
}
