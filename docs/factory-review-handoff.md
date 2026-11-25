# Factory review handoff

1. Create a feature branch for the accepted request. Keep the change limited to its acceptance criteria and record the request ID, attempt ID, branch and commit SHA.
2. Open one draft pull request against the protected default branch. Link the request and summarize the change, evidence and unresolved limitations.
3. Run the required Factory validation check on the pull request's current head commit. Record the check URL and conclusion. A stale or missing check does not establish readiness.
4. Obtain independent review of that exact commit. Record the reviewer, decision and findings. Resolve every blocking finding; an outstanding Guardian veto blocks advancement.
5. Merge only through the protected pull request path after the current checks and required review pass. Draft status alone does not authorize a merge. Preserve the final pull request and merge receipts.

At every handoff, the next owner receives the request and attempt IDs, current head SHA, relevant check and review receipts, and pull request URL. Report blocked, failed and untested work explicitly. A queued request, model response or successful command exit is not proof that the requested change was delivered.
