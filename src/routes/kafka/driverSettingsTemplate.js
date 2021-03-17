import Joi from 'joi'
import searchApi from '../../elasticsearch/searchApi'
import {logger} from '@peoplenet/node-service-common'
import {isEmpty, find, reduce} from 'lodash'
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
        logger.info({id: entity.id}, `Processed Driver settings template ${method} event`) //TODO: Remove this logger info
        return hapi.response()
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
    const body = await reduce(members, async (reducedMembers, memberData) => {
        const action = await reducedMembers
        const index = await getDriverSearchIndex(memberData.entityId)
        action.push({
            update: {
                _id: memberData.entityId,
                _index: index
            }
        })
        action.push({doc: {uniqueMemberGroup}})
        return action
    }, Promise.resolve([]))

    await client.bulk({body})
}

const getDriverSearchIndex = async entityId => {
    const {body} = await client.exists({index: 'driver', id: entityId})
    return body ? 'driver' : 'managed_driver'
}
