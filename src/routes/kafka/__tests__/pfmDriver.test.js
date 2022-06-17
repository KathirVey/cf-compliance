const client = require('../../../elasticsearch/client')
const search = require('../../../elasticsearch/search')

jest
    .mock('../../../elasticsearch/client')
    .mock('../../../elasticsearch/search')

describe('pfm driver events', () => {
    let hapi,
        route

    const createPayloadData = data => {
        return {
            cid: 4629,
            did: 1005620,
            vid: null,
            created: '2016-11-05T05:19:29.877Z',
            createUid: 190546,
            deleteUid: null,
            deleted: null,
            name: 'Shawn M Shipp',
            idNumber: 2504434,
            password: 2504434,
            hosBitmask: 768,
            termid: 35611,
            userdata1: 'IN',
            userdata2: 'MIWE',
            dataEndDate: '2019-06-17T22:51:47.777Z',
            lastDirtyDate: null,
            dsn: null,
            cloneNote: null,
            pendingDsn: null,
            hos2EffectiveDate: null,
            bc: 1,
            trucknum: null,
            codrivers: '',
            shippingInfo: 667228,
            trailerNumber: 'p31233,p29551',
            dsaUsa607: null,
            dsaUsa708: null,
            dsaUsa607Short: null,
            dsaUsa708Short: null,
            dsaCan607: null,
            dsaCan708: null,
            dsaCan12014: null,
            dsaAlaska707: null,
            dsaAlaska808: null,
            osaUsa607: null,
            osaUsa708: null,
            osaUsa607Short: null,
            osaUsa708Short: null,
            osaCan607: null,
            osaCan708: null,
            osaCan12014: null,
            osaAlaska707: null,
            osaAlaska808: null,
            userdata3: null,
            userdata4: null,
            hos3EffectiveDate: null,
            canLastOffdutySec: 0,
            canHosEffectiveDate: null,
            teamDriver: 0,
            lastCanCycle: 512,
            version: '9.9ELOGS02',
            osaCan707: null,
            osaCan12014New: null,
            dsaCan707: null,
            dsaCan12014New: null,
            profileChange: null,
            insecurePassword: null,
            alaskaAdded: null,
            hosBitmask2: 0,
            osaState: 0,
            dsaState: 0,
            osaUs: 55757,
            dsaUs: 39600,
            osaCan: 48557,
            dsaCan: 46800,
            pcUsMiles: 5000,
            pcCanadaMiles: 0,
            pcUsPendingMiles: null,
            pcCanPendingMiles: null,
            pcUsPendingSource: null,
            pcCanPendingSource: null,
            pcUsPendingUserid: null,
            pcCanPendingUserid: null,
            last34HOff: '1899-12-30T00:00:00.000Z',
            last36HOff: '1899-12-30T00:00:00.000Z',
            last72HOff: '1899-12-30T00:00:00.000Z',
            lastDs: 2,
            lastDsDatetime: '2019-06-17T22:21:04.000Z',
            osaSpec: 0,
            dsaSpec: 0,
            last24HOff: '1899-12-30T00:00:00.000Z',
            lastRegId: 36,
            lastDsFlag: 0,
            ctaLastSent: '2019-06-18T00:56:33.000Z',
            ctaChangeFlag: 0,
            iseUserKey: 87254,
            iseUpdated: '2021-09-23T20:16:57.000Z',
            usingIseLogs: true,
            iseWelcomeSent: 1,
            ...data
        }
    }

    beforeEach(() => {
        hapi = {response: jest.fn().mockReturnThis()}
        route = require('../pfmDriver')
    })

    it('should handle pfm driver create event', async () => {
        client.exists.mockResolvedValue({body: false})
        search.mockResolvedValueOnce(
            [{
                id: 1000000
            }]
        )

        const payloadData = createPayloadData({active: 1})
        const request = {
            payload: {
                value: {
                    rowVersion: '1387076920',
                    rowDate: '2021-12-22T14:38:11.660Z',
                    operation: 'update',
                    identity: [
                        {
                            key: 'did',
                            value: 1005620,
                            type: 'Int'
                        }
                    ],
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
                pfmId: 4629
            }
        })
        expect(hapi.response).toHaveBeenCalledWith()
        expect(client.create).toHaveBeenCalledWith({
            body: {
                id: 1005620,
                customerId: 1000000,
                cid: 4629,
                did: 1005620,
                vid: null,
                driverStatus: 'Active',
                name: 'Shawn M Shipp',
                idNumber: 2504434,
                terminal: 35611,
                created: '2016-11-05T05:19:29.877Z',
                deleted: null
            },
            id: 1005620,
            index: 'pfm_driver',
            type: '_doc'
        })
        expect(client.update).not.toHaveBeenCalled()
        expect(client.delete).not.toHaveBeenCalled()
    })

    it('should handle pfm driver update event', async () => {
        client.exists.mockResolvedValue({body: true})
        search.mockResolvedValueOnce(
            [{
                id: 1000000
            }]
        )

        const payloadData = createPayloadData({active: 2})
        const request = {
            payload: {
                value: {
                    rowVersion: '1387076920',
                    rowDate: '2021-12-22T14:38:11.660Z',
                    operation: 'update',
                    identity: [
                        {
                            key: 'did',
                            value: 1005620,
                            type: 'Int'
                        }
                    ],
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
                pfmId: 4629
            }
        })
        expect(hapi.response).toHaveBeenCalledWith()
        expect(client.update).toHaveBeenCalledWith({
            body: {
                doc: {
                    id: 1005620,
                    customerId: 1000000,
                    cid: 4629,
                    did: 1005620,
                    vid: null,
                    driverStatus: 'Inactive',
                    name: 'Shawn M Shipp',
                    idNumber: 2504434,
                    terminal: 35611,
                    created: '2016-11-05T05:19:29.877Z',
                    deleted: null
                }
            },
            id: 1005620,
            index: 'pfm_driver',
            type: '_doc'
        })
        expect(client.create).not.toHaveBeenCalled()
        expect(client.delete).not.toHaveBeenCalled()
    })

    it('should handle pfm driver event when customerId is not found', async () => {
        client.exists.mockResolvedValue({body: false})
        search.mockResolvedValueOnce([])

        const payloadData = createPayloadData({active: null})
        const request = {
            payload: {
                value: {
                    rowVersion: '1387076920',
                    rowDate: '2021-12-22T14:38:11.660Z',
                    operation: 'update',
                    identity: [
                        {
                            key: 'did',
                            value: 1005620,
                            type: 'Int'
                        }
                    ],
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
                pfmId: 4629
            }
        })
        expect(hapi.response).toHaveBeenCalledWith()
        expect(client.create).not.toHaveBeenCalled()
        expect(client.update).not.toHaveBeenCalled()
        expect(client.delete).not.toHaveBeenCalled()
    })

    it('should handle pfm driver delete event', async () => {
        client.exists.mockResolvedValue({body: true})
        search.mockResolvedValueOnce(
            [{
                id: 1000000
            }]
        )

        const payloadData = createPayloadData({active: 0})
        const request = {
            payload: {
                value: {
                    rowVersion: '1387076920',
                    rowDate: '2021-12-22T14:38:11.660Z',
                    operation: 'delete',
                    identity: [
                        {
                            key: 'did',
                            value: 1005620,
                            type: 'Int'
                        }
                    ],
                    payload: {
                        ...payloadData
                    }
                }
            }
        }

        await route.handler(request, hapi)

        expect(search).not.toHaveBeenCalled()
        expect(hapi.response).toHaveBeenCalledWith()
        expect(client.delete).toHaveBeenCalledWith({
            id: 1005620,
            index: 'pfm_driver',
            type: '_doc'
        })
        expect(client.create).not.toHaveBeenCalled()
        expect(client.update).not.toHaveBeenCalled()
    })
})
