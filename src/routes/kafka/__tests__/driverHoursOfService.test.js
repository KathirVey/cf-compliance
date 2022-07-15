const client = require('../../../elasticsearch/client')
const search = require('../../../elasticsearch/search')
import {iseCompliance} from '../../../services'
const redisClient = require('../../../redis/redisClient')

process.env.ISE_COMPLIANCE_AUTH = 'someAuthToken'

jest
    .mock('../../../services')
    .mock('../../../elasticsearch/client')
    .mock('../../../elasticsearch/search')
    .mock('../../../redis/redisClient')


describe('driver hours of service events', () => {
    let hapi,
        route,
        iseHeaders,
        ruleSet,
        driverFromSearch

    const createPayloadData = data => {
        return {
            specversion: '1.0',
            id: '43fe7bfc-67ea-430f-931f-ffe3a9253d55',
            source: 'trimble.transportation.compliance',
            type: 'trimble.transportation.compliance.hours-of-service.availability.v1',
            data: {
                driver: {
                    username: 'some_driver'
                },
                cycleDutyOffDutyPeriods: '9.11:03:16',
                dailyOffDuty: '03:57:18',
                mostRecentStatus: 'Off',
                gainTimeAt: '2022-05-18T02:14:00',
                displayLocation: 'MN Crystal (Big Back Yard)',
                lastCalculatedTime: '2022-05-16T16:14:48',
                projectedDrivingTime: '08:00:00',
                statusStartDate: '2022-05-16T00:00:00',
                workshiftDriving: '11:00:00',
                workshiftDuty: '00:00:00',
                workshiftBreak: '3.21:42:00',
                workshiftElapsed: '-1.00:00:00',
                lastUpdatedAt: '2022-05-16T16:00:00.00',
                ...data
            }
        }
    }

    beforeEach(() => {
        hapi = {response: jest.fn().mockReturnThis(), code: jest.fn()}
        route = require('../driverHoursOfService')
        iseHeaders = {
            'content-type': 'application/json',
            authorization: `Basic someAuthToken`,
            'x-authenticate-orgid': 'root',
            'x-filter-orgid': '57'
        }
        driverFromSearch = {
            id: 'ea631aad-5d8c-4b37-a25c-5f0bd23164b9',
            status: 'ACTIVE',
            loginInfo: {loginId: 'some_driver', shortCode: 'P5097'},
            profile: {
                id: 'ea631aad-5d8c-4b37-a25c-5f0bd23164b9',
                loginId: 'some_driver',
                firstName: 'some_driver1',
                lastName: 'some_driver2',
                autoProvisioned: true
            },
            customer: {id: 'e4176e53-fb66-467d-92bc-ed733be8786b', companyId: 57},
            externalSources: {
                eFleetSuite: {
                    driverId: 'some_driver',
                    driverKey: 800001945
                }
            }
        }
        ruleSet = { // ruleset
            workshiftDrivingMaximumTime: 660,
            workshiftOnDutyMaximumTime: 840,
            cycleOnDutyMaximumTime: 3600,
            dailyDrivingMaximumTime: -1,
            dailyOnDutyMaximumTime: -1,
            ruleSetType: 'Us7DayPassengerCarrying',
            description: 'US 7-day passenger-carrying'
        }
    })

    it('should process driver hours of service event - ruleset not in cache', async () => {
        search.mockResolvedValueOnce([driverFromSearch])
        redisClient.get.mockResolvedValueOnce({'ruleset:3': {}})
        iseCompliance.get.mockResolvedValueOnce(ruleSet)
        iseCompliance.get.mockResolvedValueOnce({ // vehicle
            driverId: 'some_driver',
            vehicleId: 'some_vehicle_id',
            loggedIn: true,
            loginDateTime: '2022-03-24T15:55:00',
            logoutDateTime: null
        })
        client.update.mockResolvedValueOnce({body: {_id: 'ea631aad-5d8c-4b37-a25c-5f0bd23164b9'}})

        const payloadData = createPayloadData({
            hosRuleSetName: 'Us7DayPropertyCarrying',
            cycleDuty: '1.21:22:17',
            dailyDriving: '3:00:00',
            dailyDuty: '04:03:36',
            drivingTimeLeft: '00:00:00',
            workshiftRestBreak: '08:00:00',
            workshiftDriving: '05:00:00',
            workshiftDuty: '04:10:00',
            mostRecentStatusDateTime: '2000-01-02T02:04:05Z',
            accountIdentifiers: {
                pfmId: '57'
            }
        })

        const request = {
            payload: {
                value: {
                    ...payloadData
                }
            }
        }

        await route.handler(request, hapi)

        expect(search).toHaveBeenCalledWith({
            select: [],
            from: 'drivers',
            where: {
                'externalSources.eFleetSuite.driverId.keyword': 'some_driver',
                'customer.companyId': 57
            }
        })
        expect(redisClient.get).toHaveBeenCalled()
        expect(iseCompliance.get).toHaveBeenCalledTimes(2)
        expect(iseCompliance.get).toHaveBeenCalledWith('/api/HosRuleSet/details/3', {headers: iseHeaders})
        expect(iseCompliance.get).toHaveBeenCalledWith('/api/Drivers/byDriverId/some_driver/vehicle', {headers: iseHeaders})
        expect(redisClient.set).toHaveBeenCalledWith({'ruleset:3': ruleSet})
        expect(client.update).toHaveBeenCalled()
        expect(client.update).toHaveBeenCalledWith({
            index: 'driver',
            type: '_doc',
            id: 'ea631aad-5d8c-4b37-a25c-5f0bd23164b9',
            body: {
                doc: {
                    hoursOfService: {
                        ...payloadData.data,
                        lastLogbookUpdateDate: '2000-01-02T02:04:05.000Z',
                        currentDriverType: 'US 7-day passenger-carrying',
                        currentDutyStatus: payloadData.data.mostRecentStatus,
                        totalTimeInCurrentDutyStatus: '01:00',
                        hoursInCurrentDutyStatus: 1,
                        availableDriveTime: '00:00',
                        availableDutyTime: '04:10',
                        availableCycleTime: '45:22',
                        workShiftDriveTimeUsed: '06:00',
                        workShiftOnDutyTimeUsed: '09:50',
                        dailyDriveTimeUsed: 'N/A',
                        dailyOnDutyTimeUsed: 'N/A',
                        timeUntilBreak: '08:00',
                        vehicleId: 'some_vehicle_id',
                        cycleTimeUsed: '14:38'
                    }
                }
            },
            doc_as_upsert: true
        })
        expect(hapi.response).toHaveBeenCalledWith({message: 'Processed driver HOS event messageId: 43fe7bfc-67ea-430f-931f-ffe3a9253d55, cid: 57 for driverId: ea631aad-5d8c-4b37-a25c-5f0bd23164b9'})
        expect(hapi.code).toHaveBeenCalledWith(204)
    })

    it('should process driver hours of service event - ruleset in cache', async () => {
        search.mockResolvedValueOnce([driverFromSearch])
        redisClient.get.mockResolvedValueOnce({'ruleset:3': ruleSet})
        iseCompliance.get.mockResolvedValueOnce({ // vehicle
            driverId: 'some_driver',
            vehicleId: 'some_vehicle_id',
            loggedIn: true,
            loginDateTime: '2022-03-24T15:55:00',
            logoutDateTime: null
        })
        client.update.mockResolvedValueOnce({body: {_id: 'ea631aad-5d8c-4b37-a25c-5f0bd23164b9'}})

        const payloadData = createPayloadData({
            hosRuleSetName: 'Us7DayPropertyCarrying',
            cycleDuty: '1.21:22:17',
            dailyDriving: '3:00:00',
            dailyDuty: '04:03:36',
            drivingTimeLeft: '00:00:00',
            workshiftRestBreak: '08:00:00',
            workshiftDriving: '05:00:00',
            workshiftDuty: '04:10:00',
            mostRecentStatusDateTime: '2000-01-02T02:04:05Z',
            accountIdentifiers: {
                pfmId: '57'
            }
        })

        const request = {
            payload: {
                value: {
                    ...payloadData
                }
            }
        }

        await route.handler(request, hapi)

        expect(search).toHaveBeenCalledWith({
            select: [],
            from: 'drivers',
            where: {
                'externalSources.eFleetSuite.driverId.keyword': 'some_driver',
                'customer.companyId': 57
            }
        })
        expect(redisClient.get).toHaveBeenCalledWith('ruleset:3')
        expect(iseCompliance.get).toHaveBeenCalledTimes(1)
        expect(iseCompliance.get).toHaveBeenCalledWith('/api/Drivers/byDriverId/some_driver/vehicle', {headers: iseHeaders})
        expect(redisClient.set).not.toHaveBeenCalled()
        expect(client.update).toHaveBeenCalled()
        expect(client.update).toHaveBeenCalledWith({
            index: 'driver',
            type: '_doc',
            id: 'ea631aad-5d8c-4b37-a25c-5f0bd23164b9',
            body: {
                doc: {
                    hoursOfService: {
                        ...payloadData.data,
                        lastLogbookUpdateDate: '2000-01-02T02:04:05.000Z',
                        currentDriverType: 'US 7-day passenger-carrying',
                        currentDutyStatus: payloadData.data.mostRecentStatus,
                        totalTimeInCurrentDutyStatus: '01:00',
                        hoursInCurrentDutyStatus: 1,
                        availableDriveTime: '00:00',
                        availableDutyTime: '04:10',
                        availableCycleTime: '45:22',
                        workShiftDriveTimeUsed: '06:00',
                        workShiftOnDutyTimeUsed: '09:50',
                        dailyDriveTimeUsed: 'N/A',
                        dailyOnDutyTimeUsed: 'N/A',
                        timeUntilBreak: '08:00',
                        vehicleId: 'some_vehicle_id',
                        cycleTimeUsed: '14:38'
                    }
                }
            },
            doc_as_upsert: true
        })
        expect(hapi.response).toHaveBeenCalledWith({message: 'Processed driver HOS event messageId: 43fe7bfc-67ea-430f-931f-ffe3a9253d55, cid: 57 for driverId: ea631aad-5d8c-4b37-a25c-5f0bd23164b9'})
        expect(hapi.code).toHaveBeenCalledWith(204)
    })

    it('should process driver hours of service event - Canada driver type', async () => {
        const canadianRuleset = {
            workshiftDrivingMaximumTime: 780,
            workshiftOnDutyMaximumTime: 840,
            cycleOnDutyMaximumTime: 3600,
            dailyDrivingMaximumTime: 780,
            dailyOnDutyMaximumTime: 840,
            ruleSetType: 'CanadaSouthOfLatitude60NWellService',
            description: 'CanadaSouthOfLatitude60N'
        }
        search.mockResolvedValueOnce([driverFromSearch])
        redisClient.get.mockResolvedValueOnce({'ruleset:22': {}})
        iseCompliance.get.mockResolvedValueOnce(canadianRuleset)
        iseCompliance.get.mockResolvedValueOnce({ // vehicle
            driverId: 'some_driver',
            vehicleId: 'some_vehicle_id',
            loggedIn: true,
            loginDateTime: '2022-03-24T15:55:00',
            logoutDateTime: null
        })
        client.update.mockResolvedValueOnce({body: {_id: 'ea631aad-5d8c-4b37-a25c-5f0bd23164b9'}})

        const payloadData = createPayloadData({
            hosRuleSetName: 'CanadaSouthOfLatitude60NWellService',
            cycleDuty: '1.21:22:17',
            dailyDriving: '3:00:00',
            dailyDuty: '04:03:00',
            drivingTimeLeft: '00:00:00',
            workshiftRestBreak: '08:00:00',
            workshiftDriving: '05:00:00',
            workshiftDuty: '04:10:00',
            mostRecentStatusDateTime: '2000-01-02T02:04:05Z',
            accountIdentifiers: {
                pfmId: '57'
            }
        })

        const request = {
            payload: {
                value: {
                    ...payloadData
                }
            }
        }

        await route.handler(request, hapi)

        expect(search).toHaveBeenCalledWith({
            select: [],
            from: 'drivers',
            where: {
                'externalSources.eFleetSuite.driverId.keyword': 'some_driver',
                'customer.companyId': 57
            }
        })
        expect(redisClient.get).toHaveBeenCalled()
        expect(iseCompliance.get).toHaveBeenCalledTimes(2)
        expect(iseCompliance.get).toHaveBeenCalledWith('/api/HosRuleSet/details/22', {headers: iseHeaders})
        expect(iseCompliance.get).toHaveBeenCalledWith('/api/Drivers/byDriverId/some_driver/vehicle', {headers: iseHeaders})
        expect(redisClient.set).toHaveBeenCalledWith({'ruleset:22': canadianRuleset})
        expect(client.update).toHaveBeenCalled()
        expect(client.update).toHaveBeenCalledWith({
            index: 'driver',
            type: '_doc',
            id: 'ea631aad-5d8c-4b37-a25c-5f0bd23164b9',
            body: {
                doc: {
                    hoursOfService: {
                        ...payloadData.data,
                        lastLogbookUpdateDate: '2000-01-02T02:04:05.000Z',
                        currentDriverType: 'CanadaSouthOfLatitude60N',
                        currentDutyStatus: payloadData.data.mostRecentStatus,
                        totalTimeInCurrentDutyStatus: '01:00',
                        hoursInCurrentDutyStatus: 1,
                        availableDriveTime: '00:00',
                        availableDutyTime: '04:10',
                        availableCycleTime: '45:22',
                        workShiftDriveTimeUsed: '08:00',
                        workShiftOnDutyTimeUsed: '09:50',
                        dailyDriveTimeUsed: '10:00',
                        dailyOnDutyTimeUsed: '09:57',
                        timeUntilBreak: '08:00',
                        vehicleId: 'some_vehicle_id',
                        cycleTimeUsed: '14:38'
                    }
                }
            },
            doc_as_upsert: true
        })
        expect(hapi.response).toHaveBeenCalledWith({message: 'Processed driver HOS event messageId: 43fe7bfc-67ea-430f-931f-ffe3a9253d55, cid: 57 for driverId: ea631aad-5d8c-4b37-a25c-5f0bd23164b9'})
        expect(hapi.code).toHaveBeenCalledWith(204)
    })

    it('should process driver hours of service event with default ISE values', async () => {
        search.mockResolvedValueOnce([driverFromSearch])
        redisClient.get.mockResolvedValueOnce({'ruleset:3': {}})
        iseCompliance.get.mockResolvedValueOnce(ruleSet)
        iseCompliance.get.mockResolvedValueOnce({ // vehicle
            driverId: 'some_driver',
            vehicleId: 'some_vehicle_id',
            loggedIn: true,
            loginDateTime: '2022-03-24T15:55:00',
            logoutDateTime: null
        })
        client.update.mockResolvedValueOnce({body: {_id: 'ea631aad-5d8c-4b37-a25c-5f0bd23164b9'}})

        const payloadData = createPayloadData({
            hosRuleSetName: 'Us7DayPropertyCarrying',
            cycleDuty: '-1.00:00:00',
            dailyDriving: '-2.00:00:00',
            dailyDuty: '-3.00:00:00',
            drivingTimeLeft: '00:00:00',
            workshiftRestBreak: '-4.00:00:00',
            workshiftDriving: '-2.00:00:00',
            workshiftDuty: '-3.00:00:00',
            mostRecentStatusDateTime: '2000-01-02T02:04:05Z',
            accountIdentifiers: {
                pfmId: '57'
            }
        })

        const request = {
            payload: {
                value: {
                    ...payloadData
                }
            }
        }

        await route.handler(request, hapi)

        expect(search).toHaveBeenCalledWith({
            select: [],
            from: 'drivers',
            where: {
                'externalSources.eFleetSuite.driverId.keyword': 'some_driver',
                'customer.companyId': 57
            }
        })
        expect(redisClient.get).toHaveBeenCalled()
        expect(iseCompliance.get).toHaveBeenCalledTimes(2)
        expect(iseCompliance.get).toHaveBeenCalledWith('/api/HosRuleSet/details/3', {headers: iseHeaders})
        expect(iseCompliance.get).toHaveBeenCalledWith('/api/Drivers/byDriverId/some_driver/vehicle', {headers: iseHeaders})
        expect(redisClient.set).toHaveBeenCalled()
        expect(client.update).toHaveBeenCalled()
        expect(client.update).toHaveBeenCalledWith({
            index: 'driver',
            type: '_doc',
            id: 'ea631aad-5d8c-4b37-a25c-5f0bd23164b9',
            body: {
                doc: {
                    hoursOfService: {
                        ...payloadData.data,
                        lastLogbookUpdateDate: '2000-01-02T02:04:05.000Z',
                        currentDriverType: 'US 7-day passenger-carrying',
                        currentDutyStatus: payloadData.data.mostRecentStatus,
                        totalTimeInCurrentDutyStatus: '01:00',
                        hoursInCurrentDutyStatus: 1,
                        availableDriveTime: '00:00',
                        availableCycleTime: 'N/A',
                        availableDutyTime: 'UNKNOWN',
                        workShiftDriveTimeUsed: 'EXEMPT',
                        workShiftOnDutyTimeUsed: 'UNKNOWN',
                        dailyDriveTimeUsed: 'N/A',
                        dailyOnDutyTimeUsed: 'N/A',
                        timeUntilBreak: 'ELD EXEMPT',
                        vehicleId: 'some_vehicle_id',
                        cycleTimeUsed: 'N/A'
                    }
                }
            },
            doc_as_upsert: true
        })
        expect(hapi.response).toHaveBeenCalledWith({message: 'Processed driver HOS event messageId: 43fe7bfc-67ea-430f-931f-ffe3a9253d55, cid: 57 for driverId: ea631aad-5d8c-4b37-a25c-5f0bd23164b9'})
        expect(hapi.code).toHaveBeenCalledWith(204)
    })

    it('should process driver hours of service event when vehicle is not found', async () => {
        search.mockResolvedValueOnce([driverFromSearch])
        redisClient.get.mockResolvedValueOnce({'ruleset:3': ruleSet})
        iseCompliance.get.mockRejectedValueOnce({
            description: {status: 404}
        })

        client.update.mockResolvedValueOnce({body: {_id: 'ea631aad-5d8c-4b37-a25c-5f0bd23164b9'}})

        const payloadData = createPayloadData({
            hosRuleSetName: 'Us7DayPropertyCarrying',
            cycleDuty: '1.21:22:17',
            dailyDriving: '3:00:00',
            dailyDuty: '04:03:36',
            drivingTimeLeft: '00:00:00',
            workshiftRestBreak: '08:00:00',
            workshiftDriving: '05:00:00',
            workshiftDuty: '04:10:00',
            mostRecentStatusDateTime: '2000-01-02T02:04:05Z',
            accountIdentifiers: {
                pfmId: '57'
            }
        })

        const request = {
            payload: {
                value: {
                    ...payloadData
                }
            }
        }

        await route.handler(request, hapi)

        expect(search).toHaveBeenCalledWith({
            select: [],
            from: 'drivers',
            where: {
                'externalSources.eFleetSuite.driverId.keyword': 'some_driver',
                'customer.companyId': 57
            }
        })
        expect(iseCompliance.get).toHaveBeenCalledTimes(1)
        expect(redisClient.get).toHaveBeenCalledWith('ruleset:3')
        expect(iseCompliance.get).toHaveBeenCalledWith('/api/Drivers/byDriverId/some_driver/vehicle', {headers: iseHeaders})
        expect(redisClient.set).not.toHaveBeenCalled()
        expect(client.update).toHaveBeenCalled()
        expect(client.update).toHaveBeenCalledWith({
            index: 'driver',
            type: '_doc',
            id: 'ea631aad-5d8c-4b37-a25c-5f0bd23164b9',
            body: {
                doc: {
                    hoursOfService: {
                        ...payloadData.data,
                        lastLogbookUpdateDate: '2000-01-02T02:04:05.000Z',
                        currentDriverType: 'US 7-day passenger-carrying',
                        currentDutyStatus: payloadData.data.mostRecentStatus,
                        totalTimeInCurrentDutyStatus: '01:00',
                        hoursInCurrentDutyStatus: 1,
                        availableDriveTime: '00:00',
                        availableDutyTime: '04:10',
                        availableCycleTime: '45:22',
                        workShiftDriveTimeUsed: '06:00',
                        workShiftOnDutyTimeUsed: '09:50',
                        dailyDriveTimeUsed: 'N/A',
                        dailyOnDutyTimeUsed: 'N/A',
                        timeUntilBreak: '08:00',
                        cycleTimeUsed: '14:38'
                    }
                }
            },
            doc_as_upsert: true
        })
        expect(hapi.response).toHaveBeenCalledWith({message: 'Processed driver HOS event messageId: 43fe7bfc-67ea-430f-931f-ffe3a9253d55, cid: 57 for driverId: ea631aad-5d8c-4b37-a25c-5f0bd23164b9'})
        expect(hapi.code).toHaveBeenCalledWith(204)
    })

    it('should process driver hours of service event when rulesetId is not found', async () => {
        search.mockResolvedValueOnce([driverFromSearch])
        iseCompliance.get.mockResolvedValueOnce({ // vehicle
            driverId: 'some_driver',
            vehicleId: 'some_vehicle_id',
            loggedIn: true,
            loginDateTime: '2022-03-24T15:55:00',
            logoutDateTime: null
        })
        client.update.mockResolvedValueOnce({body: {_id: 'ea631aad-5d8c-4b37-a25c-5f0bd23164b9'}})

        const payloadData = createPayloadData({
            hosRuleSetName: 'Us7DayProperty_Fake_News',
            cycleDuty: '1.21:22:17',
            dailyDriving: '3:00:00',
            dailyDuty: '04:03:36',
            drivingTimeLeft: '00:00:00',
            workshiftRestBreak: '08:10:00',
            workshiftDriving: '05:00:00',
            workshiftDuty: '04:10:00',
            mostRecentStatusDateTime: '2000-01-02T02:04:05Z',
            accountIdentifiers: {
                pfmId: '57'
            }
        })

        const request = {
            payload: {
                value: {
                    ...payloadData
                }
            }
        }

        await route.handler(request, hapi)

        expect(search).toHaveBeenCalledWith({
            select: [],
            from: 'drivers',
            where: {
                'externalSources.eFleetSuite.driverId.keyword': 'some_driver',
                'customer.companyId': 57
            }
        })
        expect(redisClient.get).not.toHaveBeenCalled()
        expect(iseCompliance.get).toHaveBeenCalledTimes(1)
        expect(iseCompliance.get).toHaveBeenCalledWith('/api/Drivers/byDriverId/some_driver/vehicle', {headers: iseHeaders})
        expect(client.update).toHaveBeenCalled()
        expect(client.update).toHaveBeenCalledWith({
            index: 'driver',
            type: '_doc',
            id: 'ea631aad-5d8c-4b37-a25c-5f0bd23164b9',
            body: {
                doc: {
                    hoursOfService: {
                        ...payloadData.data,
                        lastLogbookUpdateDate: '2000-01-02T02:04:05.000Z',
                        currentDriverType: 'Unknown',
                        currentDutyStatus: payloadData.data.mostRecentStatus,
                        totalTimeInCurrentDutyStatus: '01:00',
                        hoursInCurrentDutyStatus: 1,
                        availableDriveTime: '00:00',
                        availableDutyTime: '04:10',
                        availableCycleTime: '45:22',
                        workShiftDriveTimeUsed: 'Unknown',
                        workShiftOnDutyTimeUsed: 'Unknown',
                        dailyDriveTimeUsed: 'Unknown',
                        dailyOnDutyTimeUsed: 'Unknown',
                        timeUntilBreak: '08:10',
                        vehicleId: 'some_vehicle_id',
                        cycleTimeUsed: 'Unknown'
                    }
                }
            },
            doc_as_upsert: true
        })
        expect(hapi.response).toHaveBeenCalledWith({message: 'Processed driver HOS event messageId: 43fe7bfc-67ea-430f-931f-ffe3a9253d55, cid: 57 for driverId: ea631aad-5d8c-4b37-a25c-5f0bd23164b9'})
        expect(hapi.code).toHaveBeenCalledWith(204)
    })

    it('should process driver hours of service event when rulesetId is unknown', async () => {
        search.mockResolvedValueOnce([driverFromSearch])
        iseCompliance.get.mockRejectedValueOnce({
            description: {status: 404}
        })
        client.update.mockResolvedValueOnce({body: {_id: 'ea631aad-5d8c-4b37-a25c-5f0bd23164b9'}})

        const payloadData = createPayloadData({
            hosRuleSetName: 'Unknown',
            cycleDuty: '1.21:22:17',
            dailyDriving: '3:00:00',
            dailyDuty: '04:03:36',
            drivingTimeLeft: '00:00:00',
            workshiftRestBreak: '06:03:00',
            workshiftDriving: '05:00:00',
            workshiftDuty: '04:10:00',
            mostRecentStatusDateTime: '2000-01-02T02:03:05Z',
            accountIdentifiers: {
                pfmId: '57'
            }
        })

        const request = {
            payload: {
                value: {
                    ...payloadData
                }
            }
        }

        await route.handler(request, hapi)

        expect(search).toHaveBeenCalledWith({
            select: [],
            from: 'drivers',
            where: {
                'externalSources.eFleetSuite.driverId.keyword': 'some_driver',
                'customer.companyId': 57
            }
        })
        expect(redisClient.get).not.toHaveBeenCalled()
        expect(iseCompliance.get).toHaveBeenCalledTimes(1)
        expect(iseCompliance.get).toHaveBeenCalledWith('/api/Drivers/byDriverId/some_driver/vehicle', {headers: iseHeaders})
        expect(client.update).toHaveBeenCalled()
        expect(client.update).toHaveBeenCalledWith({
            index: 'driver',
            type: '_doc',
            id: 'ea631aad-5d8c-4b37-a25c-5f0bd23164b9',
            body: {
                doc: {
                    hoursOfService: {
                        ...payloadData.data,
                        lastLogbookUpdateDate: '2000-01-02T02:03:05.000Z',
                        currentDriverType: 'Unknown',
                        currentDutyStatus: payloadData.data.mostRecentStatus,
                        totalTimeInCurrentDutyStatus: '01:01',
                        hoursInCurrentDutyStatus: 1.0166666666666666,
                        availableDriveTime: '00:00',
                        availableDutyTime: '04:10',
                        availableCycleTime: '45:22',
                        workShiftDriveTimeUsed: 'Unknown',
                        workShiftOnDutyTimeUsed: 'Unknown',
                        dailyDriveTimeUsed: 'Unknown',
                        dailyOnDutyTimeUsed: 'Unknown',
                        timeUntilBreak: '06:03',
                        cycleTimeUsed: 'Unknown'
                    }
                }
            },
            doc_as_upsert: true
        })
        expect(hapi.response).toHaveBeenCalledWith({message: 'Processed driver HOS event messageId: 43fe7bfc-67ea-430f-931f-ffe3a9253d55, cid: 57 for driverId: ea631aad-5d8c-4b37-a25c-5f0bd23164b9'})
        expect(hapi.code).toHaveBeenCalledWith(204)
    })

    it('should not process driver hours of service event when pfmId is invalid', async () => {
        const payloadData = createPayloadData({
            hosRuleSetName: 'Us7DayPropertyCarrying',
            cycleDuty: '1.21:22:17',
            dailyDriving: '3:00:00',
            dailyDuty: '04:03:36',
            drivingTimeLeft: '00:00:00',
            workshiftRestBreak: '08:00:00',
            workshiftDriving: '05:00:00',
            workshiftDuty: '04:10:00',
            mostRecentStatusDateTime: '2000-01-02T02:04:05Z',
            accountIdentifiers: {
                pfmId: 'a57'
            }
        })

        const request = {
            payload: {
                value: {
                    ...payloadData
                }
            }
        }

        await route.handler(request, hapi)

        expect(search).not.toHaveBeenCalled()
        expect(redisClient.get).not.toHaveBeenCalled()
        expect(iseCompliance.get).toHaveBeenCalledTimes(0)
        expect(client.update).not.toHaveBeenCalled()
        expect(hapi.response).toHaveBeenCalledWith({message: 'Invalid pfmId: a57 on incoming message.'})
        expect(hapi.code).toHaveBeenCalledWith(200)
    })

    it('should not process driver hours of service event when driver is not found in search', async () => {
        search.mockResolvedValueOnce([])

        const payloadData = createPayloadData({
            hosRuleSetName: 'Us7DayPropertyCarrying',
            cycleDuty: '1.21:22:17',
            dailyDriving: '3:00:00',
            dailyDuty: '04:03:36',
            drivingTimeLeft: '00:00:00',
            workshiftRestBreak: '08:00:00',
            workshiftDriving: '05:00:00',
            workshiftDuty: '04:10:00',
            mostRecentStatusDateTime: '2000-01-02T02:04:05Z',
            accountIdentifiers: {
                pfmId: '57'
            }
        })

        const request = {
            payload: {
                value: {
                    ...payloadData
                }
            }
        }

        await route.handler(request, hapi)

        expect(search).toHaveBeenCalledWith({
            select: [],
            from: 'drivers',
            where: {
                'externalSources.eFleetSuite.driverId.keyword': 'some_driver',
                'customer.companyId': 57
            }
        })
        expect(redisClient.get).not.toHaveBeenCalled()
        expect(iseCompliance.get).toHaveBeenCalledTimes(0)
        expect(client.update).not.toHaveBeenCalled()
        expect(hapi.response).toHaveBeenCalledWith({message: 'Unable to find driver with loginId: some_driver in search.'})
        expect(hapi.code).toHaveBeenCalledWith(200)
    })

    it('should not process stale driver hours of service event', async () => {
        driverFromSearch.hoursOfService = {
            workshiftBreak: '3.21:42:00',
            workshiftElapsed: '-1.00:00:00',
            workshiftRestBreak: '08:00:00',
            lastUpdatedAt: '2022-05-16T16:01:00.00'
        }

        search.mockResolvedValueOnce([driverFromSearch])
        iseCompliance.get.mockResolvedValueOnce({ // vehicle
            driverId: 'some_driver',
            vehicleId: 'some_vehicle_id',
            loggedIn: true,
            loginDateTime: '2022-03-24T15:55:00',
            logoutDateTime: null
        })
        client.update.mockResolvedValueOnce({body: {id: 'ea631aad-5d8c-4b37-a25c-5f0bd23164b9'}})

        const payloadData = createPayloadData({
            hosRuleSetName: 'Us7DayProperty_Fake_News',
            cycleDuty: '1.21:22:17',
            dailyDriving: '3:00:00',
            dailyDuty: '04:03:36',
            drivingTimeLeft: '00:00:00',
            workshiftRestBreak: '08:10:00',
            workshiftDriving: '05:00:00',
            workshiftDuty: '04:10:00',
            mostRecentStatusDateTime: '2000-01-02T02:04:05Z',
            accountIdentifiers: {
                pfmId: '57'
            }
        })

        const request = {
            payload: {
                value: {
                    ...payloadData
                }
            }
        }

        await route.handler(request, hapi)

        expect(search).toHaveBeenCalledWith({
            select: [],
            from: 'drivers',
            where: {
                'externalSources.eFleetSuite.driverId.keyword': 'some_driver',
                'customer.companyId': 57
            }
        })
        expect(redisClient.get).not.toHaveBeenCalled()
        expect(iseCompliance.get).toHaveBeenCalledTimes(0)
        expect(client.update).not.toHaveBeenCalled()
        expect(hapi.response).toHaveBeenCalledWith({message: 'Skipping message since a more recent HOS event has been already processed for driverId: ea631aad-5d8c-4b37-a25c-5f0bd23164b9.'})
        expect(hapi.code).toHaveBeenCalledWith(200)
    })

})
