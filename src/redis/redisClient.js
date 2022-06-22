const redis = require('redis')
const {RedisClient} = require('@peoplenet/node-service-common')
module.exports = new RedisClient(redis, 'cf-compliance')
