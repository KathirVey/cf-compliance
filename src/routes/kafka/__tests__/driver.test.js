const client = require('../../../elasticsearch/client')
const search = require('../../../elasticsearch/search')

jest
    .mock('../../../elasticsearch/client')
    .mock('../../../elasticsearch/search')

describe('managed drivers events', () => {
    let hapi
    let route
    let payloadData

    beforeEach(() => {
        hapi = {response: jest.fn().mockReturnThis()}
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
                lastName: 'Paul',
                autoProvisioned: false
            },
            customer: {
                id: 'customerId',
                companyId: 75,
                description: 'My Company'
            }
        }
    })

    it('should handle managed driver create events with hydrated uniqueMemberGroup', async () => {
        client.exists.mockResolvedValue({body: false})
        search.mockResolvedValueOnce([])

        const request = {
            payload: {
                value: {
                    method: 'CREATE',
                    payload: {
                        id: 'managedDriverCreateId',
                        ...payloadData
                    }
                }
            }
        }

        await route.handler(request, hapi)

        expect(search).toHaveBeenCalledWith({
            select: ['id', 'name', 'description'],
            from: 'driverSettingsTemplates',
            where: {
                'associations.members.entityId.keyword': 'managedDriverCreateId'
            }
        })

        expect(hapi.response).toHaveBeenCalledWith()
        expect(client.create).toHaveBeenCalledWith({
            body: {
                id: 'managedDriverCreateId',
                status: 'ACTIVE',
                loginInfo: {
                    loginId: 'test222',
                    shortCode: '222'
                },
                profile: {
                    id: 'profileId',
                    firstName: 'Aaron',
                    lastName: 'Paul',
                    autoProvisioned: false
                },
                customer: {
                    companyId: 75,
                    description: 'My Company',
                    id: 'customerId'
                },
                uniqueMemberGroup: {}
            },
            id: 'managedDriverCreateId',
            index: 'driver',
            type: '_doc'
        })
        expect(client.update).not.toHaveBeenCalled()
        expect(client.delete).not.toHaveBeenCalled()
    })

    it('should handle managed driver update events with hydrated uniqueMemberGroup', async () => {
        client.exists.mockResolvedValue({body: true})
        search.mockResolvedValueOnce(
            [{
                id: 'memberId',
                name: 'memberName',
                description: 'description'

            }]
        )

        const request = {
            payload: {
                value: {
                    method: 'UPDATE',
                    payload: {
                        id: 'managedDriverUpdateId',
                        ...payloadData
                    }
                }
            }
        }

        await route.handler(request, hapi)

        expect(search).toHaveBeenCalledWith({
            select: ['id', 'name', 'description'],
            from: 'driverSettingsTemplates',
            where: {
                'associations.members.entityId.keyword': 'managedDriverUpdateId'
            }
        })

        expect(hapi.response).toHaveBeenCalledWith()
        expect(client.update).toHaveBeenCalledWith({
            body: {
                doc: {
                    id: 'managedDriverUpdateId',
                    status: 'ACTIVE',
                    loginInfo: {
                        loginId: 'test222',
                        shortCode: '222'
                    },
                    profile: {
                        id: 'profileId',
                        firstName: 'Aaron',
                        lastName: 'Paul',
                        autoProvisioned: false
                    },
                    customer: {
                        companyId: 75,
                        description: 'My Company',
                        id: 'customerId'
                    },
                    uniqueMemberGroup: {
                        description: 'description',
                        id: 'memberId',
                        name: 'memberName'
                    }
                }
            },
            id: 'managedDriverUpdateId',
            index: 'driver',
            type: '_doc'
        })
        expect(client.create).not.toHaveBeenCalled()
        expect(client.delete).not.toHaveBeenCalled()
    })

    it('should handle managed driver delete events', async () => {
        client.exists.mockResolvedValue({body: true})

        const request = {
            payload: {
                value: {
                    method: 'DELETE',
                    payload: {
                        id: 'managedDriverDeleteId',
                        ...payloadData
                    }
                }
            }
        }

        await route.handler(request, hapi)

        expect(hapi.response).toHaveBeenCalledWith()
        expect(client.delete).toHaveBeenCalledWith({
            id: 'managedDriverDeleteId',
            index: 'driver',
            type: '_doc'
        })
        expect(client.create).not.toHaveBeenCalled()
        expect(client.update).not.toHaveBeenCalled()
    })
})
