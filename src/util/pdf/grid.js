import {createCanvas} from 'canvas'
import {canvasConfig, gridConfig} from './pdfConfig'
import {getFormattedTimeFromSeconds} from './commonFunctions'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import {registerFont} from 'canvas'
import path from 'path'

dayjs.extend(utc)
dayjs.extend(timezone)

const fontDirectoryName = path.resolve(__dirname, `../../fonts/OpenSans-Regular.ttf`)
registerFont(fontDirectoryName, {family: 'sans-serif', weight: 'normal'})

const grid = (startDate, endDate, statusChangeEvents, timeZone) => {    
    const {width: canvasWidth, height: canvasHeight} = canvasConfig
    const {
        width, 
        height, 
        startX, 
        startY, 
        lineWidth, 
        lineColor, 
        textColor, 
        midnightNoonColor, 
        statusChangeColor, 
        pcFillStyleColor, 
        pcStrokeStyleColor, 
        ymFillStyleColor, 
        ymStrokeStyleColor
    } = gridConfig
    
    // create a new canvas element
    const canvas = createCanvas(canvasWidth, canvasHeight)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    //Draw function for outer rectangle
    const drawRectangle = (x, y, w, h) => {
        ctx.beginPath()
        ctx.lineWidth = lineWidth
        ctx.strokeStyle = lineColor
        ctx.strokeRect(x, y, w, h)
    }

    //Draw function for duty status stripes
    const drawFillRectangle = (x, y, w, h) => {
        ctx.beginPath()
        ctx.fillStyle = statusChangeColor
        ctx.fillRect(x, y, w, h)
    }
    
    //Draw function for PC/YM status stripes
    const drawFillRectangleForPcYm = (x, y, w, h, style) => {
        ctx.beginPath()
        if (style === 'PC') {                                           
            ctx.fillStyle = pcFillStyleColor
            ctx.fillRect(x, y, w, h)                
            ctx.strokeStyle = pcStrokeStyleColor
            ctx.lineWidth = lineWidth
            for (let i = -h; i <= w; i += 12) {
                ctx.beginPath()
                const startX1 = Math.max(x, x + i)
                let startY1 = y
                if (i < 0) {
                    startY1 = y - i
                }
                let endX = x + i + h
                let endY = y + h                                        
                if (endX > x + w) {                        
                    endX = x + w
                    endY = startY1 + (endX - startX1)
                }
                ctx.moveTo(startX1, startY1)
                ctx.lineTo(endX, endY)
                ctx.stroke()
            }
        } else if (style === 'YM') {
            ctx.fillStyle = ymFillStyleColor
            ctx.fillRect(x, y, w, h)                
            ctx.strokeStyle = ymStrokeStyleColor
            ctx.lineWidth = lineWidth
            for (let i = 0; i <= w + h; i += 12) {
                ctx.beginPath()
                const startX1 = x + Math.max(0, i - h)
                const startY1 = y + Math.min(i, h)
                const endX = x + Math.min(i, w)
                const endY = y + Math.max(0, i - w)
                ctx.moveTo(startX1, startY1)
                ctx.lineTo(endX, endY)
                ctx.stroke()
            }
        }                               
    }

    //Draw function for lines
    const drawLine = (x1, y1, x2, y2, color = lineColor) => {
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.lineWidth = lineWidth
        ctx.strokeStyle = color
        ctx.stroke()
    }

    //Draw function for text
    const drawText = (text, x, y, font = '11px sans-serif') => {
        ctx.font = font           
        ctx.fillStyle = textColor
        ctx.fillText(text, x, y)
    }

    //Draw vertical grid lines (15 min, 30 min, 45 min, 1hr lines)
    const drawVeritcalLines = (xStart, x1, y1, x2, y2, color = lineColor) => {
        if (x1 > xStart && x1 < xStart + width) {
            drawLine(x1, y1, x2, y2, color)
        }
    }

    startDate = dayjs.tz(startDate, timeZone)
    endDate = dayjs.tz(endDate, timeZone)

    const statusChangeLabels = ['Off', 'SB', 'D', 'On']
    const startDateUtc = startDate.utc()
    const endDateUtc = endDate.utc()
    const hoursArray = new Array()
    const hoursLabelTextArray = new Array()

    let currentDateTimeUtc = startDateUtc
    while (currentDateTimeUtc <= endDateUtc) {
        const currentDateTime = currentDateTimeUtc.tz(timeZone)
        if (currentDateTime.minute()) {
            const updatedUtcTime = currentDateTimeUtc.add(60 - currentDateTime.minute(), 'minute')
            if (updatedUtcTime < endDateUtc) {
                hoursLabelTextArray.push(updatedUtcTime.tz(timeZone).format('HH:mm'))
            }            
        } 
        const hourString = currentDateTimeUtc.tz(timeZone).format('HH:mm')
        hoursArray.push(hourString)
        currentDateTimeUtc = currentDateTimeUtc.add(1, 'hour')
    }

    if (!hoursLabelTextArray.length) { 
        hoursLabelTextArray.push(...hoursArray)
    }

    const horizonatlLineheight = height / statusChangeLabels.length
    const verticalLineWidth = width / (hoursArray.length - 1)
    const widthInSeconds = width / ((hoursArray.length - 1) * 3600)
    const hourOffSetWidthInSeconds = (startDate.minute() > 0 ? (60 - startDate.minute()) : 0) * widthInSeconds * 60

    const drawStatusChangeRectangles = statusChangeEvent => {
        let startPosition = 0
        statusChangeEvent.forEach((event, index) => {            
            startPosition += index === 0 ? startX : (statusChangeEvent[index - 1].width)
            if (event.style === 'PC' || event.style === 'YM') {
                drawFillRectangleForPcYm(
                    startPosition, 
                    startY + (horizonatlLineheight * event.positionIndex) + horizonatlLineheight / 3, 
                    event.width, 
                    horizonatlLineheight / 3, 
                    event.style
                )
            } else {
                drawFillRectangle(
                    startPosition, 
                    startY + (horizonatlLineheight * event.positionIndex) + horizonatlLineheight / 3, 
                    event.width, 
                    horizonatlLineheight / 3
                )
            }
        })
    }

    const drawSummaryText = mappedStatusChangeEvents => {
        const summary = mappedStatusChangeEvents.reduce((prev, curr) => {
            return {
                On: prev.On + (curr.status === 'On' ? curr.durationInSeconds : 0),
                Off: prev.Off + (curr.status === 'Off' ? curr.durationInSeconds : 0),
                D: prev.D + (curr.status === 'D' ? curr.durationInSeconds : 0),
                SB: prev.SB + (curr.status === 'SB' ? curr.durationInSeconds : 0),
                total: prev.total + curr.durationInSeconds
            }
        }, {On: 0, Off: 0, D: 0, SB: 0, total: 0})
        
        const gridSummary = statusChangeLabels.map((label, index) => {
            return {
                value: summary[label],
                positionIndex: index
            }
        })
        gridSummary.push({value: summary.total, positionIndex: 4})

        gridSummary.forEach(sum => {    
            drawText(
                getFormattedTimeFromSeconds(sum.value), 
                startX + width + 5, 
                startY + (horizonatlLineheight / 2) + (horizonatlLineheight * sum.positionIndex), 
                '13px sans-serif'
            )
        })
    }

    const mappedStatusChangeEvent = statusChangeEvents.map((event, index) => {
        const startDateTime = dayjs.tz(event.startDateTime, 'UTC').isBefore(startDateUtc) ? startDateUtc : dayjs.tz(event.startDateTime, 'UTC')
        const endDateTime = index === statusChangeEvents.length - 1 ? endDateUtc : dayjs.tz(statusChangeEvents[index + 1].startDateTime, 'UTC')

        const differenceInSeconds = endDateTime.diff(startDateTime, 'second')
        return {
            status: event.status,
            durationInSeconds: differenceInSeconds,
            width: differenceInSeconds * widthInSeconds,
            positionIndex: statusChangeLabels.indexOf(event.status),
            style: event.style
        }
    }).filter(evt => evt.durationInSeconds > 0)

    //Grid outer rectangle
    drawRectangle(startX, startY, width, height)

    //Summary seperator line
    drawLine(startX + width + 5, startY + height, startX + width + 50, startY + height)
            
    //Draw horizontal lines & status change labels
    statusChangeLabels.forEach((label, index) => {
        //Draw status change labels
        drawText(
            label, 
            startX - 25, 
            startY + (horizonatlLineheight / 2) + (horizonatlLineheight * index), 
            '13px sans-serif'
        )

        //Draw horizontal lines
        index !== 0 && drawLine(
            startX, 
            startY + (horizonatlLineheight * index), 
            startX + width, 
            startY + (horizonatlLineheight * index)
        )
    })        

    //Draw vertical lines & hours
    hoursArray.forEach((_, index) => {        
        //Draw hour lines        
        drawVeritcalLines(
            startX, 
            startX + hourOffSetWidthInSeconds + (verticalLineWidth * index), 
            startY, 
            startX + hourOffSetWidthInSeconds + (verticalLineWidth * index), 
            startY + height
        )

        //Draw 15, 30, 45 minute lines
        statusChangeLabels.forEach((__, i) => {
            if (i < 2) {
                //Draw 15 minute lines
                drawVeritcalLines(
                    startX,
                    startX + hourOffSetWidthInSeconds + (verticalLineWidth * index) + (verticalLineWidth * 3 / 4) - (30 * widthInSeconds * 60),
                    startY + (horizonatlLineheight * i), 
                    startX + hourOffSetWidthInSeconds + (verticalLineWidth * index) + (verticalLineWidth * 3 / 4) - (30 * widthInSeconds * 60),
                    startY + (horizonatlLineheight * i) + (horizonatlLineheight / 4)
                )

                //Draw 30 minute lines
                drawVeritcalLines(
                    startX, 
                    startX + hourOffSetWidthInSeconds + ((verticalLineWidth * index) / 2) + ((verticalLineWidth * (index - 1)) / 2),
                    startY + (horizonatlLineheight * i), 
                    startX + hourOffSetWidthInSeconds + ((verticalLineWidth * index) / 2) + ((verticalLineWidth * (index - 1)) / 2), 
                    startY + (horizonatlLineheight * i) + (horizonatlLineheight / 2)
                )

                //Draw 45 minute lines
                drawVeritcalLines(
                    startX,
                    startX + hourOffSetWidthInSeconds + (verticalLineWidth * index) + (verticalLineWidth / 4) - (30 * widthInSeconds * 60),
                    startY + (horizonatlLineheight * i), 
                    startX + hourOffSetWidthInSeconds + (verticalLineWidth * index) + (verticalLineWidth / 4) - (30 * widthInSeconds * 60),
                    startY + (horizonatlLineheight * i) + (horizonatlLineheight / 4)
                )                
            } else {
                //Draw 15 minute lines
                drawVeritcalLines(
                    startX,
                    startX + hourOffSetWidthInSeconds + (verticalLineWidth * index) + (verticalLineWidth * 3 / 4) - (30 * widthInSeconds * 60),
                    startY + (horizonatlLineheight * i) + (horizonatlLineheight * (3 / 4)),
                    startX + hourOffSetWidthInSeconds + (verticalLineWidth * index) + (verticalLineWidth * 3 / 4) - (30 * widthInSeconds * 60),
                    startY + (horizonatlLineheight * i) + horizonatlLineheight
                )

                //Draw 30 minute lines
                drawVeritcalLines(
                    startX,
                    startX + hourOffSetWidthInSeconds + ((verticalLineWidth * index) / 2) + ((verticalLineWidth * (index - 1)) / 2), 
                    startY + (horizonatlLineheight * i) + (horizonatlLineheight / 2), 
                    startX + hourOffSetWidthInSeconds + ((verticalLineWidth * index) / 2) + ((verticalLineWidth * (index - 1)) / 2), 
                    startY + (horizonatlLineheight * i) + horizonatlLineheight
                )

                //Draw 45 minute lines
                drawVeritcalLines(
                    startX,
                    startX + hourOffSetWidthInSeconds + (verticalLineWidth * index) + (verticalLineWidth / 4) - (30 * widthInSeconds * 60),
                    startY + (horizonatlLineheight * i) + (horizonatlLineheight * (3 / 4)), 
                    startX + hourOffSetWidthInSeconds + (verticalLineWidth * index) + (verticalLineWidth / 4) - (30 * widthInSeconds * 60),
                    startY + (horizonatlLineheight * i) + horizonatlLineheight
                )
            }
        })
    })

    //Draw hours text & midnight / noon text
    hoursLabelTextArray.forEach((hour, index, arr) => {
        //Draw hours text
        drawText(
            hour, 
            startX + hourOffSetWidthInSeconds + (verticalLineWidth * index) - 14, 
            startY - 10
        )
        
        if (hour === '00:00' || hour === '12:00') {            
            //Draw Midnight / Noon Dark line
            index !== 0 && index !== arr.length - 1 && drawVeritcalLines(
                startX, 
                startX + hourOffSetWidthInSeconds + (verticalLineWidth * index), 
                startY, 
                startX + hourOffSetWidthInSeconds + (verticalLineWidth * index), 
                startY + height, 
                midnightNoonColor
            )

            //Draw Midnight / Noon Text at the bottom of the graph
            index !== arr.length - 1 && drawText(
                hour === '00:00' ? 'MID NIGHT' : 'NOON', 
                startX + hourOffSetWidthInSeconds + (verticalLineWidth * index) - 17, 
                startY + height + 15
            )
        }
    })

    //Draw status change rectangles
    drawStatusChangeRectangles(mappedStatusChangeEvent)

    //Draw summary text
    drawSummaryText(mappedStatusChangeEvent)

    //Draw legends
    drawFillRectangle(startX + 150, startY + height + 30, 20, 20)
    drawFillRectangleForPcYm(startX + ((width) / 2) - 70, startY + height + 30, 20, 20, 'PC')
    drawFillRectangleForPcYm(startX + width - 260, startY + height + 30, 20, 20, 'YM')

    drawText('OFF / SB / D / ON', startX + 180, startY + height + 45)
    drawText('Personal Conveyance (OFF)', startX + ((width) / 2) - 40, startY + height + 45)    
    drawText('Yard Moves (ON)', startX + width - 230, startY + height + 45)

    return canvas
}

export default grid
