const mockService = () => ({
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn()
})

export const iseCompliance = mockService()
export const driverService = mockService()
export const enterpriseData = mockService()

