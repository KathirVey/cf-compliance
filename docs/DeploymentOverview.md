# Deployment overview

## Integrations
This service depends on these services/processes/databases in various capacities.

- This service is **NOT** exposed to the public internet.
- Kafka
    - Consumes data from kafka but does not publish. If there are kafka issues there will be data inconsistencies.
    Currently this service will shutdown if it cannot connect to kafka on startup. Once kafka connection returns to a
    healthy state missed events should be consumed.

## Rollback Strategy
What to do if a deployment goes wrong.

#### Rolling Deploy - No rollback is required
- This service lives in k8s and new deployments only get traffic if they start up healthy.
- If the service still will not start up successfully, development changes may be required to fix the issue.

## Blast Radius
What could be affected by a deployment / failure?

#### Unable to view associated drivers for vehicles, no driver updates in search
In the event this service fails, the user will be unable to view associated drivers for a vehicle. Search updates for driver events will also be missed.

## Deployment Failure Troubleshooting
Known possible issues on deployment and how to resolve them.

#### Pod fails to start up healthy / continues to be restarted
Validate k8s configuration & secrets, and integration points. If these appear correct, check the logs in SumoLogic to see if the issue is apparent. If the issue is not clear, and not environmental, contact the Component Owner documented on the Architecture A3 for this service.
