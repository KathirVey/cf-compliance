const mockService = () => ({
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn()
})

export const driverService = mockService()
export const enterpriseData = mockService()
export const rawIseCompliance = mockService()
export const connectedfleetcache = mockService()

