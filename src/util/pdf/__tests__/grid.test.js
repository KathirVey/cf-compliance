import canvas from 'canvas'
import grid from '../grid'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

let canvasMock
let ctxMock

const setup = propsOverride => {
    const startDateTime = '2022-01-01T00:00:00Z'
    const endDateTime = '2022-01-02T00:00:00Z'
    const timeZone = 'America/Chicago'
    const statusChangeEvents = [
        {status: 'Off', startDateTime: '2022-01-01T06:00:00Z'},
        {status: 'On', startDateTime: '2022-01-01T07:00:00Z'},
        {status: 'D', startDateTime: '2022-01-01T08:00:00Z'},
        {status: 'SB', startDateTime: '2022-01-01T09:00:00Z'},
        {status: 'Off', startDateTime: '2022-01-01T10:00:00Z'}
    ]

    const props = {
        startDateTime,
        endDateTime,
        statusChangeEvents,
        timeZone,
        ...propsOverride
    }

    return props
}

beforeEach(() => {
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
        getContext: jest.fn(() => ctxMock)
    }

    jest.spyOn(canvas, 'createCanvas').mockImplementation(() => canvasMock)
})

afterEach(() => {
    jest.restoreAllMocks()
})

it('should draw a canvas with the correct dimensions', () => {
    const {startDateTime, endDateTime, statusChangeEvents, timeZone} = setup()
    grid(startDateTime, endDateTime, statusChangeEvents, timeZone)

    expect(canvas.createCanvas).toHaveBeenCalledWith(1000, 400)
    expect(canvasMock.getContext).toHaveBeenCalledWith('2d')
    expect(ctxMock.strokeRect).toHaveBeenCalledWith(40, 30, 900, 300)
})

it('should draw grid labels (status change & hours)', () => {
    const {startDateTime, endDateTime, statusChangeEvents, timeZone} = setup({endDateTime: '2022-01-01T05:00:00Z'})
    grid(startDateTime, endDateTime, statusChangeEvents, timeZone)

    //Status change labels
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(1, 'Off', 15, 67.5)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(2, 'SB', 15, 142.5)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(3, 'D', 15, 217.5)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(4, 'On', 15, 292.5)

    //Hour labels
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(5, '00:00', 26, 20)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(7, '01:00', 206, 20)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(8, '02:00', 386, 20)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(9, '03:00', 566, 20)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(10, '04:00', 746, 20)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(11, '05:00', 926, 20)
})

it('should draw midnight & noon labels', () => {
    const {startDateTime, endDateTime, statusChangeEvents, timeZone} = setup()
    grid(startDateTime, endDateTime, statusChangeEvents, timeZone)

    expect(ctxMock.fillText).toHaveBeenNthCalledWith(6, 'MID NIGHT', 23, 345)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(19, 'NOON', 473, 345)
})

it('should draw horizontal grid lines', () => {
    const {startDateTime, endDateTime, statusChangeEvents, timeZone} = setup()
    grid(startDateTime, endDateTime, statusChangeEvents, timeZone)

    //First line below Off label
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(2, 40, 105)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(2, 940, 105)

    //Second line below SB label
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(3, 40, 180)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(3, 940, 180)

    //Third line below D label
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(4, 40, 255)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(4, 940, 255)
})

it('should draw hour lines', () => {
    const {startDateTime, endDateTime, statusChangeEvents, timeZone} = setup({endDateTime: '2022-01-01T03:00:00Z'})
    grid(startDateTime, endDateTime, statusChangeEvents, timeZone)

    //Line at 01:00 hours
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(9, 340, 30)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(9, 340, 330)

    //Line at 02:00 hours
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(22, 640, 30)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(22, 640, 330)
})

it('should draw minute lines (15, 30, 45)', () => {
    const {startDateTime, endDateTime, statusChangeEvents, timeZone} = setup({endDateTime: '2022-01-01T01:00:00Z'})
    grid(startDateTime, endDateTime, statusChangeEvents, timeZone)

    //Lines at 00:15
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(5, 265, 30)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(5, 265, 48.75)

    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(6, 265, 105)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(6, 265, 123.75)

    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(7, 265, 236.25)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(7, 265, 255)

    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(8, 265, 311.25)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(8, 265, 330)

    //Lines at 00:30
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(9, 490, 30)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(9, 490, 67.5)

    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(11, 490, 105)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(11, 490, 142.5)

    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(13, 490, 217.5)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(13, 490, 255)
    
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(15, 490, 292.5)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(15, 490, 330)

    //Lines at 00:45
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(10, 715, 30)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(10, 715, 48.75)

    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(12, 715, 105)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(12, 715, 123.75)

    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(14, 715, 236.25)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(14, 715, 255)

    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(16, 715, 311.25)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(16, 715, 330)
})

it('should draw status change reactanges and grid summary', () => {
    const {startDateTime, endDateTime, statusChangeEvents, timeZone} = setup({endDateTime: '2022-01-01T05:00:00Z'})
    grid(startDateTime, endDateTime, statusChangeEvents, timeZone)

    //Status change rectanges
    expect(ctxMock.fillRect).toHaveBeenNthCalledWith(2, 40, 55, 180, 25) //Off duty
    expect(ctxMock.fillRect).toHaveBeenNthCalledWith(3, 220, 280, 180, 25) //On duty
    expect(ctxMock.fillRect).toHaveBeenNthCalledWith(4, 400, 205, 180, 25) //Driving
    expect(ctxMock.fillRect).toHaveBeenNthCalledWith(5, 580, 130, 180, 25) //Sleeper berth
    expect(ctxMock.fillRect).toHaveBeenNthCalledWith(6, 760, 55, 180, 25) //Off duty

    //Grid summary
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(12, '02:00:00', 945, 67.5) //Off duty
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(13, '01:00:00', 945, 142.5) //On duty
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(14, '01:00:00', 945, 217.5) //Driving
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(15, '01:00:00', 945, 292.5) //Sleeper berth
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(16, '05:00:00', 945, 367.5) //Total

    //Grid summary line
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(1, 945, 330)
})

it('should draw legends', () => {
    const {startDateTime, endDateTime, timeZone} = setup({endDateTime: '2022-01-01T01:00:00Z'})
    grid(startDateTime, endDateTime, [], timeZone)

    //Status change legend (OFF, SB, D, ON)
    expect(ctxMock.fillRect).toHaveBeenNthCalledWith(2, 190, 360, 20, 20)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(13, 'OFF / SB / D / ON', 220, 375)
    
    //Personal conveyance legend
    expect(ctxMock.fillRect).toHaveBeenNthCalledWith(3, 420, 360, 20, 20)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(14, 'Personal Conveyance (OFF)', 450, 375)
    
    //Yard moves legend
    expect(ctxMock.fillRect).toHaveBeenNthCalledWith(4, 680, 360, 20, 20)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(15, 'Yard Moves (ON)', 710, 375)
})
