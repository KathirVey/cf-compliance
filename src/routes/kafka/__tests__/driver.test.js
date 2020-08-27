const client = require('../../../elasticsearch/client')
const search = require('../../../elasticsearch/search')

jest
    .mock('../../../elasticsearch/client')
    .mock('../../../elasticsearch/search')

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

    it('should handle driver create events with hydrated uniqueMemberGroup', async () => {
        client.exists.mockResolvedValue({body: false})
        search.mockResolvedValueOnce([])

        const request = {
            payload: {
                value: {
                    method: 'CREATE',
                    payload: {
                        id: 'driverCreateId',
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
                'associations.members.entityId.keyword': 'driverCreateId'
            }
        })

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
                },
                uniqueMemberGroup: {}
            },
            id: 'driverCreateId',
            index: 'driver',
            type: '_doc'
        })
        expect(client.update).not.toHaveBeenCalled()
        expect(client.delete).not.toHaveBeenCalled()
    })

    it('should handle driver update events with hydrated uniqueMemberGroup', async () => {
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
                        id: 'driverUpdateId',
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
                'associations.members.entityId.keyword': 'driverUpdateId'
            }
        })

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
                    },
                    uniqueMemberGroup: {
                        description: 'description',
                        id: 'memberId',
                        name: 'memberName'
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
                value: {
                    method: 'DELETE',
                    payload: {
                        id: 'driverDeleteId',
                        ...payloadData
                    }
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
