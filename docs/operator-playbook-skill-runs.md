# Operator Playbook: Skill Runs

## Running a skill

1. **Choose skill and mode** — In RECON, use "New Research" (or equivalent) and select research type (Company, Industry, Function, Technology). The UI calls `POST /api/recon/skills/execute` with `executionMode: assist`.
2. **Provide input** — For research: company/target name, optional website, industry, mission profile. For KB quality: `kb_id`. For outreach: prospect and campaign context.
3. **Review output** — Response includes `runId`, `status`, `outputPayload`, and when applicable `outputAssetId` (e.g. new research record ID). Redirect to the asset (e.g. `/recon/research/[id]`) to edit or promote.

## Reviewing and approving runs

1. **List runs** — `GET /api/recon/skill-runs?lifecycle_state=draft` (or use a future RECON "Skill runs" UI).
2. **Open run** — Inspect `input_payload`, `output_payload`, and linked `output_asset_id` (e.g. research record).
3. **Promote** — `PATCH /api/recon/skill-runs/[id]` with `lifecycle_state: reviewed` or `approved`. Optionally set `rejection_reason` and `lifecycle_state: archived` to reject.

## Execution modes

- **Assist** — You drive; the skill runs once and returns output. Default for RECON UI.
- **Human-in-the-loop (HITL)** — Same as assist; output is always `draft` until you approve the run or the linked asset.
- **Autonomous** — Reserved for `super_admin`; skills may run without per-run approval once quality gates are met (future).

## Troubleshooting

- **Skill not found** — Ensure the skill key exists in the catalog and status is `active`. List skills via `GET /api/recon/skills`.
- **Execution mode not allowed** — Use `assist` or `hitl` unless you are super_admin and the skill supports `autonomous`.
- **Research ran but no record** — Check that RECON migrations (including `research_records`, `research_type`, `skill_key`) are applied. Inspect the run’s `error_message` if `status: failed`.
