const mockService = () => ({
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn()
})

module.exports = {
    iseCompliance: mockService(),
    driverService: mockService()
}

