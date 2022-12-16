const mockContext = {
    search: jest.fn(() => ({
        data: [],
        metadata: {
            page: 0,
            pageSize: 0,
            total: 0
        }
    })),
    buildQuery: jest.fn(() => ({
        body: {
            hits: {
                hits: []
            }
        }
    }))
}

const mockClient = {
    get: jest.fn(),
    search: jest.fn(() => ({
        body: {
            hits: {
                hits: []
            }
        }
    })),
    update: jest.fn()
}

const mockLibrary = {
    mockClient,
    mockContext,
    getSearchContext: jest.fn(() => mockContext),

    getClient: jest.fn(() => mockClient),
    convertToElasticQuery: jest.fn(query => ({convertedQuery: query}))
}

module.exports = mockLibrary
