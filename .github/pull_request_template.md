## Outcome

Explain the concrete problem and resulting behavior. Link the related work item without copying private issue bodies or credentials.

## Changes

Describe the bounded change and any unresolved limitation.

## Validation

Record the exact tested revision, commands and results. The required repository check is Factory validation, which runs pnpm validate with CLI contracts required.

## Review and recovery

Name the independent reviewer and explain rollback. Keep the pull request in draft until the implementation and evidence are ready for review. Merging and deploying require their own release gates.

- [ ] Factory validation passes for this revision.
- [ ] Independent review covers the current head.
- [ ] No credentials or private account data are included.
- [ ] The change has a clear rollback.
