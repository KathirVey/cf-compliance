import jsPDF from 'jspdf'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import {logEventsTablePdf} from '../logEventsTablePdf'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(localizedFormat)

const certificationText = 'I hereby certify that my data entries and my record of duty status for this day are true and correct.'
const signatureText = `Driver's Signature`

jest.mock('jspdf', () => {
    return jest.fn().mockImplementation(() => {
        return {
            text: jest.fn(),
            autoTable: jest.fn().mockImplementation(options => {
                options.didParseCell = jest.fn()
                options.didDrawCell = jest.fn()
                options.didDrawPage = jest.fn()                
            }),            
            setFont: jest.fn(),
            setFontSize: jest.fn(),
            line: jest.fn(),
            internal: {
                pageSize: {
                    width: 300,                
                    height: 300
                }
            },
            lastAutoTable: {
                finalY: 30
            }
        }
    })
})

afterEach(() => {
    jest.clearAllMocks()
})

const setup = () => {
    const logEvents = [
        {
            id: 1,
            eventType: 'StatusChange',
            eventRecordStatus: 'Active',
            status: 'Off',
            effectiveAt: '2023-01-01 00:00:00',
            createdAt: '2023-01-01 00:00:00',
            updatedAt: '2023-01-01 00:00:00',
            vehicle: {
                cmvPowerUnitNumber: '1011',
                totalEngineHours: 70
            },
            compliance: {
                sequenceId: 1,
                eldEventType: 1,
                eldEventCode: 2,
                milesSinceLastValidGps: 1,
                elapsedEngineHours: 4,
                accumulatedVehicleMiles: 2,
                diagnostics: false,
                malfunctions: false,
                eventRecordOrigin: 2,
                originatorUsername: 'test'
            },           
            location: {
                type: 'Manual',
                city: 'Iowa',
                state: 'US-IA'
            },
            annotations: [
                {
                    createdAt: '2023-01-01 00:00:00',
                    text: 'test',
                    author: {
                        displayName: 'test',
                        username: 'test'
                    }
                }
            ]
        }
    ]
    const doc = new jsPDF({size: 'A4', orientation: 'p', compressPdf: true})  
    const props = {
        doc,
        logEvents,
        driverName: 'Test Driver',
        flag: 'US',
        timeZone: 'America/Chicago',
        currentLogDate: '2023-01-01',        
        yValue: 15
    }

    return props
}

it('generates a jspdf document with log events', async () => {  
    const {doc, logEvents, yValue, currentLogDate, timeZone, flag, driverName} = setup()
    
    logEventsTablePdf(doc, logEvents, yValue, currentLogDate, timeZone, flag, driverName)

    const instance = jsPDF.mock?.results[0]?.value
    const autoTableInstance = instance.autoTable.mock.calls[0][0]
    const tableData = autoTableInstance.body[0]

    expect(instance.text).toHaveBeenCalled()
    expect(instance.line).toHaveBeenCalled()
    expect(instance.setFont).toHaveBeenCalledTimes(2)
    expect(instance.setFontSize).toHaveBeenCalledTimes(2)
    expect(instance.autoTable).toHaveBeenCalled()
    expect(instance.text).toHaveBeenNthCalledWith(1, certificationText, 10, 40)
    expect(instance.text).toHaveBeenNthCalledWith(2, signatureText, 10, 50)

    expect(tableData.eventType).toEqual('OFF')
    expect(tableData.eventRecordStatus).toEqual('Active')
    expect(tableData.time).toEqual('12/31/22 6:00:00 PM CST')
    expect(tableData.location).toEqual('Iowa, IA (M, M)')
    expect(tableData.cmvPowerUnitNumber).toEqual('1011')
    expect(tableData.distanceSinceLastValid).toEqual('1 mi')
    expect(tableData.cmvDistance).toEqual('2 mi')
    expect(tableData.engineHours).toEqual('T: 70\nE: 4')
    expect(tableData.eventRecordOrigin).toEqual('Driver')
    expect(tableData.sequenceId).toEqual(1)
    expect(tableData.annotations[0]).toEqual('[12/31/2022 6:00:00 PM CST test (test)] test')
})
