import client from '../../../elasticsearch/client'
import route from '../driverSettingsTemplate'

jest.mock('../../../elasticsearch/client')

describe('driver settings template events', () => {
    let hapi
    let payloadData

    beforeEach(() => {
        hapi = {response: jest.fn().mockReturnThis(), code: jest.fn()}
        payloadData = {
            name: 'Template Name - 1',
            description: 'My Template',
            customer: {
                companyId: 75,
                description: 'My Company'
            }
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
        expect(hapi.code).toHaveBeenCalledWith(204)
        expect(client.create).toHaveBeenCalledWith({
            body: {
                id: 'driverSettingsTemplateId',
                name: 'Template Name - 1',
                description: 'My Template',
                customer: {
                    companyId: 75,
                    description: 'My Company'
                }
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
        expect(hapi.code).toHaveBeenCalledWith(204)
        expect(client.update).toHaveBeenCalledWith({
            body: {
                doc: {
                    id: 'driverSettingsTemplateId',
                    name: 'Template Name - 1',
                    description: 'My Template',
                    customer: {
                        companyId: 75,
                        description: 'My Company'
                    }
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
        expect(hapi.code).toHaveBeenCalledWith(204)
        expect(client.delete).toHaveBeenCalledWith({
            id: 'driverSettingsTemplateId',
            index: 'driver_settings_template',
            type: '_doc'
        })
        expect(client.create).not.toHaveBeenCalled()
        expect(client.update).not.toHaveBeenCalled()
    })
})
