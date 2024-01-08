import {eventOrigin} from './pdfConfig'
import {getEventDetail, getTfmEventRecordStatus, formatLocation, formatDistance, formatStartDateTime, formatStartDateTimeForPdf} from './commonFunctions'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
dayjs.extend(localizedFormat)

export const logEventsTablePdf = (doc, logEvents, yValue, currentLogDate, timeZone, flag, driverName) => {    
    const pageUsableWidth = doc.internal.pageSize.width - 14
    const shortColumnWidth = (pageUsableWidth * 0.32) / 4
    const defaultColumnWidth = (pageUsableWidth * 0.68) / 6

    const addHeader = () => {        
        // Start of document with header
        doc.setFontSize(15)
        const pageWidth = doc.internal.pageSize.getWidth()
        const driverNameWidth = pageWidth * 0.38        
        const splitText = doc.splitTextToSize(`${driverName} |`, driverNameWidth)       
        doc.setFont('times', 'normal')
        doc.text(`Date of RODS: `, 
            pageWidth - doc.getTextWidth(`Date of RODS: ${dayjs(currentLogDate).format('MM/DD/YYYY')}`) - 11, yValue)
        splitText.length > 1 ? doc.text(`| Driver's Log - ${flag}`, pageWidth * 0.4, yValue, {maxWidth: pageWidth * 0.5}) 
            : doc.text(`Driver's Log - ${flag}`, doc.getTextWidth(`${driverName} |`) + 14, yValue)        
        doc.setFont('times', 'bold')
        doc.text(`${dayjs(currentLogDate).format('MM/DD/YYYY')}`, 
            pageWidth - doc.getTextWidth(`Date of RODS: ${dayjs(currentLogDate).format('MM/DD/YYYY')}`) + 26, yValue)
        splitText.length > 1 ? splitTextToSize(`${driverName}`, driverNameWidth) : doc.text(`${driverName} |`, 10, yValue)
        
        // Draw a line
        const lineY = doc.getLineHeight() + (2 * splitText.length)
        doc.line(10, lineY, doc.internal.pageSize.width - 10, lineY)
    }
    
    const getTotalRows = table => table.length
    
    const calculateLineHeight = (text, columnWidth) => {
        const splitText = doc.splitTextToSize(text, columnWidth)
        return splitText.length
    }
    
    const getMaxHeightForAnnotationRows = tableContent => {
        const maxCellHeightPerRow = []
        for (let rowIndex = 0; rowIndex < tableContent.table.body.length; rowIndex++) {
            let maxCellHeight = 0
            for (let cellIndex = 0; cellIndex < 10; cellIndex++) {
                const cell = tableContent.table.body[rowIndex].cells[cellIndex]
                const cellHeight = calculateLineHeight(cell.text, cell.styles.cellWidth - (cell.styles.cellPadding * 2))
                if (cellHeight > maxCellHeight) {
                    maxCellHeight = cellHeight
                }
            }
            maxCellHeightPerRow.push(maxCellHeight)
        }
        return maxCellHeightPerRow
    }

    const splitTextToSize = (text, width) => {
        const splitText = doc.splitTextToSize(text, width)
        for (let i = 0; i < splitText.length; i++) {
            doc.text(splitText[i], 10, yValue)
            yValue += 5
        }
    }
    
    const setAnnotationPosition = (cell, nestedTable, maxCellHeightPerRow, parsedData) => {       
        const annotationRows = getTotalRows(nestedTable)
        const maxCellHeight = maxCellHeightPerRow[parsedData.row.index]
        const yIndex = (maxCellHeight + annotationRows) * (5)
        const remHeight = maxCellHeight > 1 ? (1.25 * (maxCellHeight - 1)) : 0
        const annotationsHeight = annotationRows > 0 ? yIndex - remHeight : 0
            
        if (annotationsHeight > 0) {
            cell.styles.minCellHeight = annotationsHeight
        }
    }

    const logEventsData = logEvents?.map(row => {
        return {eventType: getEventDetail(row), eventRecordStatus: getTfmEventRecordStatus(row?.eventRecordStatus), 
            time: formatStartDateTimeForPdf(row?.effectiveAt, timeZone, currentLogDate, row.isFirstEventForTheday),                 
            location: formatLocation(row, flag),
            cmvPowerUnitNumber: row?.vehicle?.cmvPowerUnitNumber ?? '-',
            distanceSinceLastValid: formatDistance(row?.compliance?.milesSinceLastValidGps, flag) ?? '-',
            cmvDistance: formatDistance(row?.compliance?.accumulatedVehicleMiles, flag),
            engineHours: `T: ${row?.vehicle?.totalEngineHours >= 0 ? row.vehicle.totalEngineHours : '-'}\nE: ${row?.compliance?.elapsedEngineHours >= 0 ? row.compliance.elapsedEngineHours : '-'}`,
            eventRecordOrigin: row?.compliance?.eventRecordOrigin ? eventOrigin[row.compliance.eventRecordOrigin] : '-',
            sequenceId: row.compliance?.sequenceId >= 0 ? row.compliance.sequenceId : '-',
            annotations: row.annotations?.map(annotation => {
                return `[${formatStartDateTime(annotation.createdAt, timeZone)} ${annotation.author.displayName ?? '-'} (${annotation.author.username ?? '-'})] ${annotation.text}`
            })                
        }
    })

    doc.autoTable({
        columns: [{
            title: 'Event',
            dataKey: 'eventType'
        }, {
            title: 'Record Status',
            dataKey: 'eventRecordStatus'
        }, {
            title: 'Time',
            dataKey: 'time'
        },            
        {
            title: 'Location',
            dataKey: 'location'
        }, {
            title: 'CMV No.',
            dataKey: 'cmvPowerUnitNumber'
        }, 
        {
            title: 'Distance last val. coord.',
            dataKey: 'distanceSinceLastValid'
        },
        {
            title: flag === 'US' ? 'Vehicle Miles' : 'Vehicle Distance',
            dataKey: 'cmvDistance'
        }, {
            title: 'Engine Hours',
            dataKey: 'engineHours'
        }, {
            title: 'Record Origin',
            dataKey: 'eventRecordOrigin'
        }, {
            title: 'Seq ID',
            dataKey: 'sequenceId'
        }],
        body: logEventsData,
        showHead: 'firstPage',
        columnStyles: {
            keys: {fillColor: [0, 255, 0], textColor: 255, fontStyle: 'bold', fontSize: 8},
            values: {fontSize: 8, overflow: 'linebreak'},
            eventType: {cellWidth: defaultColumnWidth},
            eventRecordStatus: {cellWidth: defaultColumnWidth},
            time: {cellWidth: defaultColumnWidth},                
            location: {cellWidth: defaultColumnWidth},
            cmvPowerUnitNumber: {cellWidth: defaultColumnWidth},
            distanceSinceLastValid: {cellWidth: shortColumnWidth},               
            cmvDistance: {cellWidth: shortColumnWidth},                
            engineHours: {cellWidth: shortColumnWidth},
            eventRecordOrigin: {cellWidth: shortColumnWidth},                            
            sequenceId: {cellWidth: shortColumnWidth}                
        },
        startY: yValue,
        margin: {left: 10, top: 25, bottom: 10},
        theme: 'plain',
        pageBreak: 'auto',
        tableWidth: 'wrap',
        rowPageBreak: 'avoid',
        styles: {fontSize: 8},
        didParseCell: parsedData => {
            const maxCellHeightForAnnotationRowsInParseHook = getMaxHeightForAnnotationRows(parsedData)                                                                       
            parsedData?.row?.raw?.annotations && setAnnotationPosition(parsedData.cell, parsedData.row.raw.annotations, maxCellHeightForAnnotationRowsInParseHook, parsedData)                
        },
        didDrawCell: tableData => {
            const maxCellHeightForAnnotationRows = getMaxHeightForAnnotationRows(tableData)    
               
            if (tableData.row?.raw?.annotations && tableData?.section === 'body' && tableData?.column.index === 0) {                                         
                const annotations = tableData.row.raw.annotations
                for (let i = 0; i < annotations.length; i++) {                       
                    const yIndex = maxCellHeightForAnnotationRows[tableData.row.index] * 3.5
                    doc.text(annotations[i], tableData.cell.x + 2, tableData.cell.y + i * 5 + yIndex + 5)
                }
            }
            if (tableData.section === 'body' || tableData.section === 'head') {
                doc.setLineWidth(0.1)
                doc.line(tableData.cell.x, tableData.cell.y + tableData.cell.height, tableData.cell.x + tableData.cell.width, tableData.cell.y + tableData.cell.height)
            }
        },
        didDrawPage() {
            yValue = 15
            addHeader()
            const currentPage = doc.internal.getNumberOfPages()
            doc.setFont('times', 'bold')
            doc.setFontSize(8)
            const pageWidth = doc.internal.pageSize.getWidth()
            doc.text(`Page ${currentPage} of {total_pages_count_string}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10)
        }
    })

    //Add certification text
    const certificationText = 'I hereby certify that my data entries and my record of duty status for this day are true and correct.'                            
    const signature = `Driver's Signature`
    doc.setFont('times', 'bold')
    doc.setFontSize(8)
    doc.text(certificationText, 10, doc.lastAutoTable.finalY + 10)

    // Use the below commented block when we receive certification info from RODS
    // When log day is certified
    // const certifiedByText = `Certified by ${driverName} on ${new Date().toLocaleDateString()}`
    // doc.setFont('times', 'normal')
    // doc.setFontSize(8)
    // doc.text(certifiedByText, 10, doc.lastAutoTable.finalY + 15)
    
    // When log day is not certified
    doc.setFont('times', 'normal')
    doc.setFontSize(8)               
    doc.line(10, doc.lastAutoTable.finalY + 16, (doc.internal.pageSize.width / 2) - 10, doc.lastAutoTable.finalY + 16)
    doc.text(signature, 10, doc.lastAutoTable.finalY + 20)

    return doc
}
