module.exports = {
    extends: './node_modules/@peoplenet/node-service-common/.eslintrc.js',
    rules: {
        'no-restricted-imports': 'off',
        'node/no-extraneous-import': 'off', // TODO: remove this when bumping nsc to 20.1.1
        'no-restricted-properties': 'off'
    }
}
