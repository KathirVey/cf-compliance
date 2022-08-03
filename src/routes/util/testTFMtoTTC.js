const {compliance} = require('../../services')

module.exports = {
    method: 'POST',
    path: '/testTFMtoTTC',
    handler: async ({headers}) => {
        return compliance.get('/unidentifiedDrivingEvents', {headers})
    },
    options: {
        description: 'Test route',
        auth: 'user-profile',
        tags: ['api']
    }
}
