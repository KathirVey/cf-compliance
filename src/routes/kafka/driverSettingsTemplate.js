import Joi from '@hapi/joi'
import searchApi from '../../elasticsearch/searchApi'
import {logger} from '@peoplenet/node-service-common'
import {isEmpty, find, transform} from 'lodash'
import client from '../../elasticsearch/client'

export default {
    method: 'POST',
    path: '/kafka/driverSettingsTemplate',
    async handler({payload}, hapi) {
        const {value} = payload
        const {method, payload: entity} = value
        const {id, name, description, associations = []} = entity
        const driverMembers = find(associations, {groupType: 'DRIVER'})
        const {members = []} = driverMembers
        if (method === 'CREATE' || method === 'UPDATE') {
            await searchApi.upsert('driver_settings_template', entity)
        } else if (method === 'DELETE') {
            await searchApi.delete('driver_settings_template', entity)
        } else if (method === 'ASSIGN' && !isEmpty(members)) {
            await bulkUpdateDriverSearch(members, {id, name, description})
        } else if (method === 'UNASSIGN' && !isEmpty(members)) {
            await bulkUpdateDriverSearch(members, null)
        }
        logger.info(`Processed Driver settings template ${method} event`, {id: entity.id}) //TODO: Remove this logger info
        return hapi.response().code(204)
    },
    options: {
        description: 'Update search based on driver settings template events',
        tags: ['api'],
        validate: {
            payload: Joi.object().required()
        }
    }
}

const bulkUpdateDriverSearch = async (members, uniqueMemberGroup) => {
    const body = transform(members, (actions, membersData) => {
        actions.push({
            update: {_id: membersData.entityId}
        })
        actions.push({doc: {uniqueMemberGroup}})
    }, [])
    await client.bulk({index: 'driver', type: '_doc', body})
}