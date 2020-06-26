import {createServer} from '@peoplenet/node-service-common'

const serve = async () => createServer({routePath: `${__dirname}/routes`})

export default serve()
