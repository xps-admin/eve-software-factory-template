# Foreman production issue intake

This installation accepts maintainer-applied `factory` labels on GitHub issues. Applying the label starts an unattended run.

The bot posts its issue result as a reply on the issue thread. A completed run turn is an internal session milestone; it is not by itself a delivered result.

Verification is separate from deployment. Runs may open draft pull requests and run exact-commit CI and review checks. Nothing is merged or deployed by the run.

The production connector forwards issue events only. PR summaries, red-CI repair, and arbitrary comment intake are not enabled.
