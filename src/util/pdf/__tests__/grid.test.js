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
        {status: 'OFF', startDateTime: '2022-01-01T06:00:00Z'},
        {status: 'ON', startDateTime: '2022-01-01T07:00:00Z'},
        {status: 'D', startDateTime: '2022-01-01T08:00:00Z'},
        {status: 'SB', startDateTime: '2022-01-01T09:00:00Z'},
        {status: 'OFF', startDateTime: '2022-01-01T10:00:00Z'}
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
    expect(ctxMock.strokeRect).toHaveBeenCalledWith(70, 30, 830, 245)
})

it('should draw grid labels (status change & hours)', () => {
    const {startDateTime, endDateTime, statusChangeEvents, timeZone} = setup({endDateTime: '2022-01-01T05:00:00Z'})
    grid(startDateTime, endDateTime, statusChangeEvents, timeZone)

    //Status change labels
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(1, 'OFF', 40, 60.625)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(2, 'SB', 40, 121.875)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(3, 'D', 40, 183.125)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(4, 'ON', 40, 244.375)

    //Hour labels
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(5, '00:00', 56, 20)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(7, '01:00', 222, 20)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(8, '02:00', 388, 20)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(9, '03:00', 554, 20)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(10, '04:00', 720, 20)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(11, '05:00', 886, 20)
})

it('should draw midnight & noon labels', () => {
    const {startDateTime, endDateTime, statusChangeEvents, timeZone} = setup()
    grid(startDateTime, endDateTime, statusChangeEvents, timeZone)

    expect(ctxMock.fillText).toHaveBeenNthCalledWith(6, 'MID NIGHT', 53, 290)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(19, 'NOON', 468, 290)
})

it('should draw horizontal grid lines', () => {
    const {startDateTime, endDateTime, statusChangeEvents, timeZone} = setup()
    grid(startDateTime, endDateTime, statusChangeEvents, timeZone)

    //First line below Off label
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(2, 70, 91.25)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(2, 900, 91.25)

    //Second line below SB label
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(3, 70, 152.5)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(3, 900, 152.5)

    //Third line below D label
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(4, 70, 213.75)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(4, 900, 213.75)
})

it('should draw hour lines', () => {
    const {startDateTime, endDateTime, statusChangeEvents, timeZone} = setup({endDateTime: '2022-01-01T03:00:00Z'})
    grid(startDateTime, endDateTime, statusChangeEvents, timeZone)

    //Line at 01:00 hours
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(9, 346.6666666666667, 30)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(9, 346.6666666666667, 275)

    //Line at 02:00 hours
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(22, 623.3333333333334, 30)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(22, 623.3333333333334, 275)
})

it('should draw minute lines (15, 30, 45)', () => {
    const {startDateTime, endDateTime, statusChangeEvents, timeZone} = setup({endDateTime: '2022-01-01T01:00:00Z'})
    grid(startDateTime, endDateTime, statusChangeEvents, timeZone)

    //Lines at 00:15
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(5, 277.5, 30)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(5, 277.5, 45.3125)

    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(6, 277.5, 91.25)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(6, 277.5, 106.5625)

    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(7, 277.5, 198.4375)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(7, 277.5, 213.75)

    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(8, 277.5, 259.6875)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(8, 277.5, 275)

    //Lines at 00:30
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(9, 485, 30)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(9, 485, 60.625)

    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(11, 485, 91.25)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(11, 485, 121.875)

    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(13, 485, 183.125)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(13, 485, 213.75)
    
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(15, 485, 244.375)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(15, 485, 275)

    //Lines at 00:45
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(10, 692.5, 30)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(10, 692.5, 45.3125)

    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(12, 692.5, 91.25)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(12, 692.5, 106.5625)

    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(14, 692.5, 198.4375)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(14, 692.5, 213.75)

    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(16, 692.5, 259.6875)
    expect(ctxMock.lineTo).toHaveBeenNthCalledWith(16, 692.5, 275)
})

it('should draw status change rectangles and grid summary', () => {
    const {startDateTime, endDateTime, statusChangeEvents, timeZone} = setup({endDateTime: '2022-01-01T05:00:00Z'})
    grid(startDateTime, endDateTime, statusChangeEvents, timeZone)

    //Status change rectanges
    expect(ctxMock.fillRect).toHaveBeenNthCalledWith(2, 70, 50.41666666666667, 166, 20.416666666666668) //Off duty
    expect(ctxMock.fillRect).toHaveBeenNthCalledWith(3, 236, 234.16666666666666, 166, 20.416666666666668) //On duty
    expect(ctxMock.fillRect).toHaveBeenNthCalledWith(4, 402, 172.91666666666666, 166, 20.416666666666668) //Driving
    expect(ctxMock.fillRect).toHaveBeenNthCalledWith(5, 568, 111.66666666666667, 166, 20.416666666666668) //Sleeper berth
    expect(ctxMock.fillRect).toHaveBeenNthCalledWith(6, 220, 305, 20, 20) //Off duty

    //Grid summary
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(12, '01:00:00', 905, 60.625) //Off duty
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(13, '01:00:00', 905, 121.875) //On duty
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(14, '01:00:00', 905, 183.125) //Driving
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(15, '01:00:00', 905, 244.375) //Sleeper berth
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(16, '04:00:00', 905, 305.625) //Total

    //Grid summary line
    expect(ctxMock.moveTo).toHaveBeenNthCalledWith(1, 905, 275)
})

it('should draw legends', () => {
    const {startDateTime, endDateTime, timeZone} = setup({endDateTime: '2022-01-01T01:00:00Z'})
    grid(startDateTime, endDateTime, [], timeZone)

    //Status change legend (OFF, SB, D, ON)
    expect(ctxMock.fillRect).toHaveBeenNthCalledWith(2, 220, 305, 20, 20)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(13, 'OFF / SB / D / ON', 250, 320)
    
    //Personal conveyance legend
    expect(ctxMock.fillRect).toHaveBeenNthCalledWith(3, 415, 305, 20, 20)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(14, 'Personal Conveyance (OFF)', 445, 320)
    
    //Yard moves legend
    expect(ctxMock.fillRect).toHaveBeenNthCalledWith(4, 640, 305, 20, 20)
    expect(ctxMock.fillText).toHaveBeenNthCalledWith(15, 'Yard Moves (ON)', 670, 320)
})
