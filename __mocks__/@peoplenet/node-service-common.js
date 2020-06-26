const nodeServiceCommon = jest.requireActual('@peoplenet/node-service-common')

nodeServiceCommon.logger = {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    trace: jest.fn(),
    warn: jest.fn()
}

module.exports = nodeServiceCommon
