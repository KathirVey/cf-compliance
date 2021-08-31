import client from '../../../elasticsearch/client'
import route from '../driverSettingsTemplate'

jest.mock('../../../elasticsearch/client')

describe('driver settings template events', () => {
    let hapi
    let payloadData

    beforeEach(() => {
        hapi = {response: jest.fn().mockReturnThis()}
        payloadData = {
            name: 'Template Name - 1',
            description: 'My Template',
            customer: {
                companyId: 75,
                description: 'My Company'
            },
            associations: [
                {groupType: 'DRIVER', members: []}
            ]
        }
    })

    it('should handle driver settings template create events', async () => {
        client.exists.mockResolvedValue({body: false})

        const request = {
            payload: {
                value: {
                    method: 'CREATE',
                    payload: {
                        id: 'driverSettingsTemplateId',
                        ...payloadData
                    }
                }
            }
        }

        await route.handler(request, hapi)

        expect(hapi.response).toHaveBeenCalledWith()
        expect(client.create).toHaveBeenCalledWith({
            body: {
                id: 'driverSettingsTemplateId',
                name: 'Template Name - 1',
                description: 'My Template',
                customer: {
                    companyId: 75,
                    description: 'My Company'
                },
                associations: [
                    {groupType: 'DRIVER', members: []}
                ]
            },
            id: 'driverSettingsTemplateId',
            index: 'driver_settings_template',
            type: '_doc'
        })
        expect(client.update).not.toHaveBeenCalled()
        expect(client.delete).not.toHaveBeenCalled()
    })

    it('should handle driver settings template update events', async () => {
        client.exists.mockResolvedValue({body: true})

        const request = {
            payload: {
                value: {
                    method: 'UPDATE',
                    payload: {
                        id: 'driverSettingsTemplateId',
                        ...payloadData
                    }
                }
            }
        }

        await route.handler(request, hapi)

        expect(hapi.response).toHaveBeenCalledWith()
        expect(client.update).toHaveBeenCalledWith({
            body: {
                doc: {
                    id: 'driverSettingsTemplateId',
                    name: 'Template Name - 1',
                    description: 'My Template',
                    customer: {
                        companyId: 75,
                        description: 'My Company'
                    },
                    associations: [
                        {groupType: 'DRIVER', members: []}
                    ]
                }
            },
            id: 'driverSettingsTemplateId',
            index: 'driver_settings_template',
            type: '_doc'
        })
        expect(client.create).not.toHaveBeenCalled()
        expect(client.delete).not.toHaveBeenCalled()
    })

    it('should handle driver settings template delete events', async () => {
        client.exists.mockResolvedValue({body: true})

        const request = {
            payload: {
                value: {
                    method: 'DELETE',
                    payload: {
                        id: 'driverSettingsTemplateId',
                        ...payloadData
                    }
                }
            }
        }

        await route.handler(request, hapi)

        expect(hapi.response).toHaveBeenCalledWith()
        expect(client.delete).toHaveBeenCalledWith({
            id: 'driverSettingsTemplateId',
            index: 'driver_settings_template',
            type: '_doc'
        })
        expect(client.create).not.toHaveBeenCalled()
        expect(client.update).not.toHaveBeenCalled()
    })

    it('should not update driver search when there are no members for ASSIGN event', async () => {
        const request = {
            payload: {
                value: {
                    method: 'ASSIGN',
                    payload: {
                        id: 'id',
                        ...payloadData
                    }
                }
            }
        }

        await route.handler(request, hapi)
        expect(client.bulk).not.toHaveBeenCalled()
    })

    it('should update appropriate driver search index based on ASSIGN events', async () => {
        const request = {
            payload: {
                value: {
                    method: 'ASSIGN',
                    payload: {
                        id: 'id',
                        ...payloadData,
                        associations: [
                            {
                                groupType: 'DRIVER',
                                members: [{entityId: 'id1'}, {entityId: 'id2'}]
                            }
                        ]
                    }
                }
            }
        }

        await route.handler(request, hapi)

        expect(hapi.response).toHaveBeenCalledWith()

        expect(client.bulk).toHaveBeenCalledWith({
            body: [
                {update: {_id: 'id1', _index: 'driver'}},
                {
                    doc: {
                        uniqueMemberGroup: {
                            id: 'id',
                            name: 'Template Name - 1',
                            description: 'My Template'
                        }
                    }
                },
                {update: {_id: 'id2', _index: 'driver'}},
                {
                    doc: {
                        uniqueMemberGroup: {
                            id: 'id',
                            name: 'Template Name - 1',
                            description: 'My Template'
                        }
                    }
                }
            ]
        })
    })

    it('should update driver search based on UNASSIGN events', async () => {
        const request = {
            payload: {
                value: {
                    method: 'UNASSIGN',
                    payload: {
                        id: 'id',
                        ...payloadData,
                        associations: [
                            {
                                groupType: 'DRIVER',
                                members: [{entityId: 'id1'}, {entityId: 'id2'}]
                            }
                        ]
                    }
                }
            }
        }

        await route.handler(request, hapi)

        expect(hapi.response).toHaveBeenCalledWith()

        expect(client.bulk).toHaveBeenCalledWith({
            body: [
                {update: {_id: 'id1', _index: 'driver'}},
                {doc: {uniqueMemberGroup: null}},
                {update: {_id: 'id2', _index: 'driver'}},
                {doc: {uniqueMemberGroup: null}}
            ]
        })
    })
})
