const search = require('../elasticsearch/search')

module.exports = async cid => {
    const [customer] = await search({
        select: ['id'],
        from: 'customers',
        where: {
            pfmId: cid
        }
    })
    return customer?.id
}
