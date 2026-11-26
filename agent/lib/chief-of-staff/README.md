# Chief of Staff module

Pure, interface-driven library for turning raw ideas into structured objectives,
tracking their approval, and handing approved objectives to Foreman.

## Location

- Module: `agent/lib/chief-of-staff/`
- Tests: `tests/chief-of-staff/`

## Public API

- Models and validation: `rawIdeaSchema`, `ideaSchema`, `objectiveSchema`, `approvalSchema`, `handoffSchema`
- Repositories: `ChiefOfStaffStore`, `InMemoryChiefOfStaffStore` (aliases `InMemoryStore`, `MemoryStore`)
- Prioritization: `Prioritizer`, `heuristicPrioritizer`
- Structuring: `structureIdea`
- Intake: `intakeIdea`
- Approval state machine: `transitionApproval`, `approve`, `reject`, `requestChanges`, ...
- Handoff: `handoffObjective`, `ForemanClient`
- Logging and metrics: `createLogger`, `InMemoryMetrics`
- Service: `ChiefOfStaffService` (aliases `Coordinator`, `ChiefOfStaff`)

The module is isolated: it imports only Node built-ins, zod, and local modules.
No eve slots, tools, or channels are added.
