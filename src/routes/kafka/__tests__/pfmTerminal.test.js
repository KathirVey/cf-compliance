const client = require('../../../elasticsearch/client')
const search = require('../../../elasticsearch/search')

jest
    .mock('../../../elasticsearch/client')
    .mock('../../../elasticsearch/search')

describe('pfm terminals events', () => {
    let hapi
    let route
    let payloadData

    beforeEach(() => {
        hapi = {response: jest.fn().mockReturnThis()}
        route = require('../pfmTerminal')
        payloadData = {
            cid: 3471,
            termid: 57714,
            created: '2019-09-30T14:52:24.010Z',
            createUid: 269110,
            deleted: null,
            deleteUid: null,
            active: 1,
            name: 'testTerminalAOBRD4',
            street1: 'testing',
            street2: '',
            street3: '',
            city: 'test',
            state: 'AL',
            zipcode: 'test',
            starttime: '1900-01-01T05:00:00.000Z',
            timezone: -300,
            dstObserved: 1,
            tzid: 4,
            starttimeReg: 0,
            pcUsMiles: 0,
            pcCanadaMiles: 0,
            pcCan: 1,
            pcUs: 1,
            pcUsCreated: '2019-09-30T14:52:24.010Z',
            pcUsUid: 269110,
            pcCanCreated: '2019-09-30T14:52:24.010Z',
            pcCanUid: 269110,
            iseKey: 400000261,
            iseUpdated: '2021-12-10T18:02:52.000Z',
            iseMigrate: true,
            cidRetention: 6
        }
    })

    it('should handle pfm terminal create event', async () => {
        client.exists.mockResolvedValue({body: false})
        search.mockResolvedValueOnce(
            [{
                id: 1000000
            }]
        )

        const request = {
            payload: {
                value: {
                    rowVersion: '812098',
                    rowDate: '2021-12-10T18:03:18.660Z',
                    operation: 'update',
                    identity: [{
                        key: 'termid',
                        value: 57714,
                        type: 'Int'
                    }],
                    payload: {
                        ...payloadData
                    }
                }
            }
        }

        await route.handler(request, hapi)

        expect(search).toHaveBeenCalledWith({
            select: ['id'],
            from: 'customers',
            where: {
                pfmId: 3471
            }
        })
        expect(hapi.response).toHaveBeenCalledWith()
        expect(client.create).toHaveBeenCalledWith({
            body: {
                id: 57714,
                customerId: 1000000,
                cid: 3471,
                termid: 57714,
                created: '2019-09-30T14:52:24.010Z',
                createUid: 269110,
                deleted: null,
                deleteUid: null,
                active: 1,
                name: 'testTerminalAOBRD4',
                street1: 'testing',
                street2: '',
                street3: '',
                city: 'test',
                state: 'AL',
                zipcode: 'test',
                starttime: '1900-01-01T05:00:00.000Z',
                timezone: -300,
                dstObserved: 1,
                tzid: 4,
                starttimeReg: 0,
                pcUsMiles: 0,
                pcCanadaMiles: 0,
                pcCan: 1,
                pcUs: 1,
                pcUsCreated: '2019-09-30T14:52:24.010Z',
                pcUsUid: 269110,
                pcCanCreated: '2019-09-30T14:52:24.010Z',
                pcCanUid: 269110,
                iseKey: 400000261,
                iseUpdated: '2021-12-10T18:02:52.000Z',
                iseMigrate: true,
                cidRetention: 6
            },
            id: 57714,
            index: 'pfm_terminal',
            type: '_doc'
        })
        expect(client.update).not.toHaveBeenCalled()
        expect(client.delete).not.toHaveBeenCalled()
    })

    it('should handle pfm terminal update event', async () => {
        client.exists.mockResolvedValue({body: true})
        search.mockResolvedValueOnce(
            [{
                id: 1000000
            }]
        )

        const request = {
            payload: {
                value: {
                    rowVersion: '812098',
                    rowDate: '2021-12-10T18:03:18.660Z',
                    operation: 'update',
                    identity: [{
                        key: 'termid',
                        value: 57714,
                        type: 'Int'
                    }],
                    payload: {
                        ...payloadData
                    }
                }
            }
        }

        await route.handler(request, hapi)

        expect(search).toHaveBeenCalledWith({
            select: ['id'],
            from: 'customers',
            where: {
                pfmId: 3471
            }
        })
        expect(hapi.response).toHaveBeenCalledWith()
        expect(client.update).toHaveBeenCalledWith({
            body: {
                doc: {
                    id: 57714,
                    customerId: 1000000,
                    cid: 3471,
                    termid: 57714,
                    created: '2019-09-30T14:52:24.010Z',
                    createUid: 269110,
                    deleted: null,
                    deleteUid: null,
                    active: 1,
                    name: 'testTerminalAOBRD4',
                    street1: 'testing',
                    street2: '',
                    street3: '',
                    city: 'test',
                    state: 'AL',
                    zipcode: 'test',
                    starttime: '1900-01-01T05:00:00.000Z',
                    timezone: -300,
                    dstObserved: 1,
                    tzid: 4,
                    starttimeReg: 0,
                    pcUsMiles: 0,
                    pcCanadaMiles: 0,
                    pcCan: 1,
                    pcUs: 1,
                    pcUsCreated: '2019-09-30T14:52:24.010Z',
                    pcUsUid: 269110,
                    pcCanCreated: '2019-09-30T14:52:24.010Z',
                    pcCanUid: 269110,
                    iseKey: 400000261,
                    iseUpdated: '2021-12-10T18:02:52.000Z',
                    iseMigrate: true,
                    cidRetention: 6
                }
            },
            id: 57714,
            index: 'pfm_terminal',
            type: '_doc'
        })
        expect(client.create).not.toHaveBeenCalled()
        expect(client.delete).not.toHaveBeenCalled()
    })

    it('should handle pfm terminal event when customerId is not found', async () => {
        client.exists.mockResolvedValue({body: true})
        search.mockResolvedValueOnce([])

        const request = {
            payload: {
                value: {
                    rowVersion: '812098',
                    rowDate: '2021-12-10T18:03:18.660Z',
                    operation: 'update',
                    identity: [{
                        key: 'termid',
                        value: 57714,
                        type: 'Int'
                    }],
                    payload: {
                        ...payloadData
                    }
                }
            }
        }

        await route.handler(request, hapi)

        expect(search).toHaveBeenCalledWith({
            select: ['id'],
            from: 'customers',
            where: {
                pfmId: 3471
            }
        })
        expect(hapi.response).toHaveBeenCalledWith()
        expect(client.create).not.toHaveBeenCalled()
        expect(client.update).not.toHaveBeenCalled()
        expect(client.delete).not.toHaveBeenCalled()
    })

    it('should handle pfm terminal delete event', async () => {
        client.exists.mockResolvedValue({body: true})

        const request = {
            payload: {
                value: {
                    rowVersion: '812098',
                    rowDate: '2021-12-10T18:03:18.660Z',
                    operation: 'delete',
                    identity: [{
                        key: 'termid',
                        value: 57714,
                        type: 'Int'
                    }],
                    payload: {
                        ...payloadData
                    }
                }
            }
        }

        await route.handler(request, hapi)

        expect(hapi.response).toHaveBeenCalledWith()
        expect(client.delete).toHaveBeenCalledWith({
            id: 57714,
            index: 'pfm_terminal',
            type: '_doc'
        })
        expect(client.create).not.toHaveBeenCalled()
        expect(client.update).not.toHaveBeenCalled()
    })
})
