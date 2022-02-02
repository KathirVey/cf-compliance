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
        const driverMembers = find(associations, {groupType: 'DRIVER'}) || []
        let error = []
        const {members = []} = driverMembers
        if (method === 'CREATE' || method === 'UPDATE') {
            await searchApi.upsert('driver_settings_template', entity)
            if (!isEmpty(members)) {
                error = await bulkUpdateDriverSearch(members, {id, name, description})
            }
        } else if (method === 'DELETE') {
            error = await searchApi.delete('driver_settings_template', entity)
        } else if (method === 'ASSIGN' && !isEmpty(members)) {
            error = await bulkUpdateDriverSearch(members, {id, name, description})
        } else if (method === 'UNASSIGN' && !isEmpty(members)) {
            error = await bulkUpdateDriverSearch(members, null)
        }

        if (error?.length) {
            logger.error({error}, 'Error during bulk driver update')
            return hapi.response().code(207)
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
        action.push({
            update: {
                _id: memberData.entityId,
                _index: 'driver'
            }
        })
        action.push({doc: {uniqueMemberGroup}})
        return action
    }, Promise.resolve([]))
    const {body: {errors, items}} = await client.bulk({body})

    const erroredDocument = []

    if (errors) {
        items.map(item => {
            const operation = Object.keys(item)[0]
            if (item[operation].error) {
                erroredDocument.push({
                    status: item[operation].status,
                    error: item[operation].error
                })
            }
        })
    }
    return erroredDocument
}
