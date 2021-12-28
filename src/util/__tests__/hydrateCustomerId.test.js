const search = require('../../elasticsearch/search')
const getCustomerIdFromCid = require('../../util/hydrateCustomerId')

jest.mock('@elastic/elasticsearch')
    .mock('../../elasticsearch/search')

describe('hydrate customer id from cid', () => {

    it('should return customer id from search', async () => {
        search.mockResolvedValueOnce([{
            id: 1000000
        }])

        const customerId = await getCustomerIdFromCid(1234)

        expect(customerId).toEqual(1000000)
        expect(search).toHaveBeenCalledWith({
            select: ['id'],
            from: 'customers',
            where: {
                pfmId: 1234
            }
        })
    })

    it('should return undefined when customer id is not found in search', async () => {
        search.mockResolvedValueOnce([])

        const customerId = await getCustomerIdFromCid(4321)

        expect(customerId).toBeUndefined()
        expect(search).toHaveBeenCalledWith({
            select: ['id'],
            from: 'customers',
            where: {
                pfmId: 4321
            }
        })
    })

})
