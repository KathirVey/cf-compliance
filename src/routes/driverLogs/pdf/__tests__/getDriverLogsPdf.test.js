import {ttc} from '../../../../services'
import {jsPDF} from 'jspdf'
import route from '../getDriverLogsPdf'
import {logger} from '@peoplenet/node-service-common'
import canvas from 'canvas'

jest.mock('../../../../services')
    .mock('jspdf', () => {
        const mockJsPDF = {
            text: jest.fn(),
            autoTable: jest.fn(),
            addImage: jest.fn(),
            addPage: jest.fn(),
            setFont: jest.fn(),
            setFontSize: jest.fn(),
            line: jest.fn(),            
            output: jest.fn(() => 'success').mockReturnValueOnce('data:pdfDataUrl'),
            internal: {
                pageSize: {
                    width: 300,                
                    height: 300
                }
            },
            lastAutoTable: {
                finalY: 30
            },
            putTotalPages: jest.fn()
        }    
        mockJsPDF.autoTable.mockReturnValue(mockJsPDF)
        return {
            jsPDF: jest.fn().mockImplementation(() => mockJsPDF)
        }
    })
    .mock('jspdf-autotable', () => {
        return {
            applyPlugin: jest.fn()
        }
    })

let request, hapi, ctxMock, canvasMock

beforeEach(() => {
    hapi = {
        response: jest.fn(() => hapi),
        code: jest.fn(() => hapi)
    }

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
            driverId: 'test'
        },
        query: {
            startDateTime: '2023-01-01',
            endDateTime: '2023-01-01',
            timeZone: 'America/Chicago',
            flag: 'US',
            driverName: 'Test Driver'
        }
    }

    logger.error = jest.fn()

    ctxMock = {
        fillStyle: null,
        fillRect: jest.fn(),
        beginPath: jest.fn(),
        lineWidth: null,
        strokeStyle: null,
        strokeRect: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        font: null,
        fillText: jest.fn()
    }

    canvasMock = {
        getContext: jest.fn(() => ctxMock),
        toDataURL: jest.fn(() => 'data:pdfDataUrl')
    }

    jest.spyOn(canvas, 'createCanvas').mockImplementation(() => canvasMock)
})

afterEach(() => {
    jest.restoreAllMocks()
})

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

it('should process driver logs pdf', async () => {
    ttc.get.mockResolvedValueOnce(logEvents)
    
    await route.handler(request, hapi)
    const instance = jsPDF.mock?.results[0]?.value

    expect(ttc.get).toHaveBeenCalledWith(`compliance/v1/driverlogs/events/test?startLogDate=2023-01-01&endLogDate=2023-01-01`, {headers: {
        'x-jwt-Assertion': 'access_token',
        'x-application-customer': 'user_ac_id'
    }})
    expect(instance.addImage).toHaveBeenCalledWith(expect.anything(), 'JPEG', 13, 30, 180, expect.anything())
    expect(instance.putTotalPages).toHaveBeenCalled()
    expect(instance.output).toHaveBeenCalledWith('dataurlstring', {filename: `DriverLogs-test`})
    expect(hapi.response).toHaveBeenCalledWith('data:pdfDataUrl')
    expect(hapi.code).toHaveBeenCalledWith(201)
})

it('should handle errors during pdf generation', async () => {
    ttc.get.mockRejectedValueOnce('error')

    await route.handler(request, hapi)

    expect(logger.error).toHaveBeenCalledWith('error', 'test', 'Encountered error during pdf generation')
    expect(hapi.response).toHaveBeenCalledWith({message: 'Error while generating driver logs pdf'})
    expect(hapi.code).toHaveBeenCalledWith(500)
})
