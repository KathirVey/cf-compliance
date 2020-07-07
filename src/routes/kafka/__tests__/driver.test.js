const client = require('../../../elasticsearch/client')

jest.mock('../../../elasticsearch/client')

describe('drivers events', () => {
    let hapi
    let route
    let payloadData

    beforeEach(() => {
        hapi = {response: jest.fn().mockReturnThis(), code: jest.fn()}
        route = require('../driver')
        payloadData = {
            status: 'ACTIVE',
            loginInfo: {
                loginId: 'test222',
                shortCode: '222'
            },
            profile: {
                id: 'profileId',
                firstName: 'Aaron',
                lastName: 'Paul'
            },
            customer: {
                companyId: 75,
                description: 'My Company'
            }
        }
    })

    it('should handle driver create events', async () => {
        client.exists.mockResolvedValue({body: false})

        const request = {
            payload: {
                method: 'CREATE',
                payload: {
                    id: 'driverCreateId',
                    ...payloadData
                }
            }
        }

        await route.handler(request, hapi)

        expect(hapi.response).toHaveBeenCalledWith()
        expect(hapi.code).toHaveBeenCalledWith(204)
        expect(client.create).toHaveBeenCalledWith({
            body: {
                id: 'driverCreateId',
                status: 'ACTIVE',
                loginInfo: {
                    loginId: 'test222',
                    shortCode: '222'
                },
                profile: {
                    id: 'profileId',
                    firstName: 'Aaron',
                    lastName: 'Paul'
                },
                customer: {
                    companyId: 75,
                    description: 'My Company'
                }
            },
            id: 'driverCreateId',
            index: 'driver',
            type: '_doc'
        })
        expect(client.update).not.toHaveBeenCalled()
        expect(client.delete).not.toHaveBeenCalled()
    })

    it('should handle driver update events', async () => {
        client.exists.mockResolvedValue({body: true})

        const request = {
            payload: {
                method: 'UPDATE',
                payload: {
                    id: 'driverUpdateId',
                    ...payloadData
                }
            }
        }

        await route.handler(request, hapi)

        expect(hapi.response).toHaveBeenCalledWith()
        expect(hapi.code).toHaveBeenCalledWith(204)
        expect(client.update).toHaveBeenCalledWith({
            body: {
                doc: {
                    id: 'driverUpdateId',
                    status: 'ACTIVE',
                    loginInfo: {
                        loginId: 'test222',
                        shortCode: '222'
                    },
                    profile: {
                        id: 'profileId',
                        firstName: 'Aaron',
                        lastName: 'Paul'
                    },
                    customer: {
                        companyId: 75,
                        description: 'My Company'
                    }
                }
            },
            id: 'driverUpdateId',
            index: 'driver',
            type: '_doc'
        })
        expect(client.create).not.toHaveBeenCalled()
        expect(client.delete).not.toHaveBeenCalled()
    })

    it('should handle driver delete events', async () => {
        client.exists.mockResolvedValue({body: true})

        const request = {

            payload: {
                method: 'DELETE',
                payload: {
                    id: 'driverDeleteId',
                    ...payloadData
                }
            }
        }

        await route.handler(request, hapi)

        expect(hapi.response).toHaveBeenCalledWith()
        expect(hapi.code).toHaveBeenCalledWith(204)
        expect(client.delete).toHaveBeenCalledWith({
            id: 'driverDeleteId',
            index: 'driver',
            type: '_doc'
        })
        expect(client.create).not.toHaveBeenCalled()
        expect(client.update).not.toHaveBeenCalled()
    })
})
