# Deployment overview

## Integrations
This service depends on these services/processes/databases in various capacities.

- This service is **NOT** exposed to the public internet.
- Kafka
    - Consumes data from kafka but does not publish. If there are kafka issues there will be data inconsistencies. 
    Currently this service will shutdown if it cannot connect to kafka on startup. Once kafka connection returns to a 
    healthy state missed events should be consumed.
- Postgres
    - This services uses a postgres database. If the connection to the DB fails during startup, the service will restart itself.
    
While not directly dependent (i.e they don't affect service health), this service is the gateway to all other services in the network that provide for CFC.

## Rollback Strategy
What to do if a deployment goes wrong.

#### Rolling Deploy - No rollback is required
- This service lives in k8s and new deployments only get traffic if they start up healthy.
- If the service still will not start up successfully, development changes may be required to fix the issue.

## Blast Radius
What could be affected by a deployment / failure?

#### CRITICAL - CXSupport Portal will be unable to perform any action
In the event this service fails, the user will be _unable to perform any actions_ other than logging into the site. All data requests and commands will fail. This will not affect system consistency, and once the service returns to health the system will perform normally.

## Deployment Failure Troubleshooting
Known possible issues on deployment and how to resolve them.

#### Pod fails to start up healthy / continues to be restarted
Validate k8s configuration & secrets, and integration points. If these appear correct, check the logs in SumoLogic to see if the issue is apparent. If the issue is not clear, and not environmental, contact the Component Owner documented on the Architecture A3 for this service.
