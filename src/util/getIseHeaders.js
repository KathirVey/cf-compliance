module.exports = pfmCid => {
    return {
        'content-type': 'application/json',
        authorization: `Basic ${process.env.ISE_COMPLIANCE_AUTH}`,
        'x-authenticate-orgid': 'root',
        'x-filter-orgid': pfmCid
    }
}
