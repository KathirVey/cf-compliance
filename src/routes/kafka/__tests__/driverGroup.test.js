import client from '../../../elasticsearch/client'
import route from '../driverGroup'

jest.mock('../../../elasticsearch/client')

describe('driver group events', () => {
    let hapi
    let payloadData

    beforeEach(() => {
        hapi = {response: jest.fn().mockReturnThis(), code: jest.fn()}
        payloadData = {
            name: 'Group Name - 1',
            description: 'My group',
            customer: {
                companyId: 75,
                description: 'My Company'
            }
        }
    })

    it('should handle driver Group create events', async () => {
        client.exists.mockResolvedValue({body: false})

        const request = {
            payload: {
                value: {
                    method: 'CREATE',
                    payload: {
                        id: 'driverGroupCreateId',
                        ...payloadData
                    }
                }
            }
        }

        await route.handler(request, hapi)

        expect(hapi.response).toHaveBeenCalledWith()
        expect(hapi.code).toHaveBeenCalledWith(204)
        expect(client.create).toHaveBeenCalledWith({
            body: {
                id: 'driverGroupCreateId',
                name: 'Group Name - 1',
                description: 'My group',
                customer: {
                    companyId: 75,
                    description: 'My Company'
                }
            },
            id: 'driverGroupCreateId',
            index: 'driver_group',
            type: '_doc'
        })
        expect(client.update).not.toHaveBeenCalled()
        expect(client.delete).not.toHaveBeenCalled()
    })

    it('should handle driver Group update events', async () => {
        client.exists.mockResolvedValue({body: true})

        const request = {
            payload: {
                value: {
                    method: 'UPDATE',
                    payload: {
                        id: 'driverGroupUpdateId',
                        ...payloadData
                    }
                }
            }
        }

        await route.handler(request, hapi)

        expect(hapi.response).toHaveBeenCalledWith()
        expect(hapi.code).toHaveBeenCalledWith(204)
        expect(client.update).toHaveBeenCalledWith({
            body: {
                doc: {
                    id: 'driverGroupUpdateId',
                    name: 'Group Name - 1',
                    description: 'My group',
                    customer: {
                        companyId: 75,
                        description: 'My Company'
                    }
                }
            },
            id: 'driverGroupUpdateId',
            index: 'driver_group',
            type: '_doc'
        })
        expect(client.create).not.toHaveBeenCalled()
        expect(client.delete).not.toHaveBeenCalled()
    })

    it('should handle driver Group delete events', async () => {
        client.exists.mockResolvedValue({body: true})

        const request = {
            payload: {
                value: {
                    method: 'DELETE',
                    payload: {
                        id: 'driverGroupDeleteId',
                        ...payloadData
                    }
                }
            }
        }

        await route.handler(request, hapi)

        expect(hapi.response).toHaveBeenCalledWith()
        expect(hapi.code).toHaveBeenCalledWith(204)
        expect(client.delete).toHaveBeenCalledWith({
            id: 'driverGroupDeleteId',
            index: 'driver_group',
            type: '_doc'
        })
        expect(client.create).not.toHaveBeenCalled()
        expect(client.update).not.toHaveBeenCalled()
    })
})
