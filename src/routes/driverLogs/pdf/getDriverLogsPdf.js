const {ttc} = require('../../../services')
import Joi from 'joi'
import {jsPDF} from 'jspdf'
import dayjs from 'dayjs'
import grid from '../../../util/pdf/grid'
import {applyPlugin} from 'jspdf-autotable'
import {logEventsTablePdf} from '../../../util/pdf/logEventsTablePdf'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import {logger} from '@peoplenet/node-service-common'

dayjs.extend(localizedFormat)
applyPlugin(jsPDF)

const route = {
    method: 'GET',
    path: '/driverLogsPdf/{driverId}',
    handler: async ({headers, params, query}, hapi) => {
        const {driverId} = params
        const {startDateTime, endDateTime, timeZone, flag, driverName} = query
        
        try {
            let doc = new jsPDF({size: 'A4', orientation: 'p', compressPdf: true})
            doc.setFont('times', 'normal')

            const getStatus = status => {
                switch (status) {
                    case 'SleeperBerth':
                        return 'SB'
                    case 'Driving':
                        return 'D'
                    case 'OffWaiting' || 'OffSleeping':
                        return 'Off'
                    default:
                        return status
                }
            }

            let currentLogDate = startDateTime

            while (!dayjs(currentLogDate).isAfter(dayjs(endDateTime))) {
                currentLogDate !== startDateTime && doc.addPage('A4', 'p')                
                let yValue = 15
                const logEvents = await ttc.get(`compliance/v1/driverlogs/events/${driverId}?startLogDate=${currentLogDate}&endLogDate=${currentLogDate}`, {headers})
                
                const statusChangeEvents = logEvents?.filter(event => (event.eventType === 'StatusChange' || (event.eventType === 'PcYmChange' && event.compliance.eldEventCode !== 0)))
                    .filter(evt => evt.eventRecordStatus === 'Active')
                    .map(event => {
                        let eventStatus, style   
                        if (event.eventType === 'PcYmChange') {
                            eventStatus = event.compliance.eldEventCode === 1 ? 'Off' : 'On'
                            style = event.compliance.eldEventCode === 1 ? 'PC' : 'YM'
                        } else {
                            eventStatus = getStatus(event.status)
                            style = 'nonPcYM'
                        }
                        return {                            
                            status: eventStatus,
                            startDateTime: event.effectiveAt,
                            style
                        }
                    })                
                const canvas = grid(currentLogDate, dayjs(currentLogDate).add(1, 'day').format('YYYY-MM-DD'), statusChangeEvents, timeZone)                
                yValue += 50
                doc.addImage(canvas.toDataURL('image/png'), 'PNG', 13, 30, 180, yValue)
                
                const firstEventForTheDay = logEvents?.reduce((prev, curr) => {
                    const currDate = dayjs.tz(curr.effectiveAt, 'UTC').tz(timeZone).format('YYYY-MM-DD')
                    return (currDate === currentLogDate && (!prev || curr.effectiveAt < prev.effectiveAt)) ? curr : prev
                }, null)?.effectiveAt

                const logEventsForPdf = logEvents?.map(event => {                 
                    if (event.effectiveAt === firstEventForTheDay) { 
                        return {
                            ...event,
                            isFirstEventForTheday: true
                        }
                    }

                    return {
                        ...event,
                        isFirstEventForTheday: false
                    }
                })
                // Render list of log events
                yValue += 35
                doc = logEventsTablePdf(doc, logEventsForPdf, yValue, currentLogDate, timeZone, flag, driverName)

                currentLogDate = dayjs(currentLogDate).add(1, 'day').format('YYYY-MM-DD')
            }

            // Put total pages number
            if (typeof doc.putTotalPages === 'function') {
                doc.putTotalPages('{total_pages_count_string}')
            }

            const pdfDataUri = doc.output('dataurlstring', {filename: `DriverLogs-${driverId}`})
            return hapi.response(pdfDataUri).code(201)
        } catch (error) {
            logger.error(error, driverId, 'Encountered error during pdf generation')
            return hapi.response({message: 'Error while generating driver logs pdf'}).code(500)
        }
    },
    options: {
        description: 'driver logs PDF route',
        auth: 'user-profile',
        app: {
            permission: 'DRIVER-LOGS-READ',
            overridePermission: ['CXS-CUSTOMER-READ']
        },
        tags: ['api'],
        validate: {
            params: Joi.object({
                driverId: Joi.string().required()                
            }).required().description('Driver ID is required'),
            query: Joi.object({
                startDateTime: Joi.string().required(),
                endDateTime: Joi.string().required(),
                timeZone: Joi.string(),
                flag: Joi.string(),
                driverName: Joi.string()
            }).required().description('Start and End log dates are required')
        }
    }
}

export default route
