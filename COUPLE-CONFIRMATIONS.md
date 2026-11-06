# Individual couple confirmations ? migration and release checklist

Frontend changes are prepared locally. No production spreadsheet was read or changed and no live acceptance was submitted. The current deployed backend and sheet state remain unverified. Do not release these buttons until the checks below pass and the spreadsheet owner approves migration.

## Proposed role rows (for review, not an import file)

Keep the joint IDs, historical responses, timestamps and RSVP rows intact. Add each missing individual at an unused data row (row 6 or later); do not insert over summaries or formulas.

| A: Recipient Name | B: Wedding Role | C: Invited By | D: Response | E: Timestamp | F: Invitation ID | G: Notes |
|---|---|---|---|---|---|---|
| Ninang Ethel | Copy verified value from ethel-michael | Copy verified value from ethel-michael | Pending if new | Blank if new | ethel | Individual from ethel-michael |
| Ninong Michael | Copy verified value from ethel-michael | Copy verified value from ethel-michael | Pending if new | Blank if new | michael | Individual from ethel-michael |
| Kuya Emil | Copy verified value from emil-susan | Copy verified value from emil-susan | Pending if new | Blank if new | emil | Individual from emil-susan |
| Ate Susan | Copy verified value from emil-susan | Copy verified value from emil-susan | Pending if new | Blank if new | susan | Individual from emil-susan |
| Ninang Cherry | Copy verified value from cherry-bernabe | Copy verified value from cherry-bernabe | Pending if new | Blank if new | cherry | Individual from cherry-bernabe |
| Ninong Bernabe | Copy verified value from cherry-bernabe | Copy verified value from cherry-bernabe | Pending if new | Blank if new | bernabe | Individual from cherry-bernabe |

B and C are deliberately not guessed. Inspect each actual joint row and confirm these values apply to each spouse. Existing individual rows, including their responses and timestamps, must be preserved rather than recreated or reset. A joint Accepted response never establishes individual consent.

## Safe migration review

1. Make a private backup/version of both tabs. Record the exact affected rows before editing.
2. Privately inspect all six individual IDs and three joint IDs in column F of both tabs. Record existing responses, timestamps, counts, messages, notes and any duplicate IDs. Resolve conflicts with the couple before proceeding.
3. Review the six proposed role rows above, fill in verified role/invited-by values and obtain manual approval. Do not run an automatic migration.
4. Add only missing approved role rows. Do not pre-create attendance records or mark anyone Accepted from a joint response.
5. Retain joint RSVP history. Flag it privately for reconciliation so aggregate guest counts do not count both the historical joint entry and later individual entries. Decide the reporting treatment with the spreadsheet owner; the website does not remove or alter historical entries.

## Backend contract and dedicated tests

The previously supplied unified handler searches column F, locks writes, reuses RSVP by ID and creates Attending / count 1 for an accepted individual. That algorithm needs no new request type. There is no backend source in the current repository to establish that the production deployment uses that exact implementation. Verify the actual deployed version privately before release.

In a private test copy with a separately deployed test backend, prepare two dedicated test role rows with IDs test-couple-a and test-couple-b, real valid role/invited-by values, Pending and empty timestamps. Use only a local copy of invitation configuration to map one couple's buttons to those IDs and point responseApi.url to the test deployment. Do not publish the test configuration or use real recipient IDs for live tests.

- Click A. Verify only A's role is Accepted and only A has an RSVP row: [name, Attending, 1, timestamp, empty message, test-couple-a, backend note]. B remains Pending with no RSVP.
- Click B while A is still processing, then verify B independently; both responses must include the matching individual invitationId and Boolean success: true. No second weddingRSVP request is sent.
- Repeat the exact test request after success and after a lost acknowledgment. Verify one RSVP row per ID and preserved timestamps. These server-side guarantees cannot be established by frontend mocks alone.
- Simulate errors, a missing acknowledgment ID and the other spouse's acknowledgment ID. None may show success or change the other button's state.
- Check the three shared links and their old aliases, all single-person invitations, desktop and mobile widths 320/360/390/430. Buttons must remain side by side with no horizontal overflow. No status badges, dialogs or letter changes are introduced.

Local regression command: `node --test tests/invitations.test.cjs tests/music.test.cjs tests/rsvp.test.cjs tests/gallery.test.cjs`. These tests mock the API and never accept real guests.

## Deployment and rollback

After test-copy verification and approved production row preparation, deploy the normal static-site changes using the existing workflow. Keep the API URL unchanged. Test single-person invitations only with dedicated test IDs; never accept a real invitation for verification.

To roll back the UI, restore the previous js/invitation-data.js, js/invite.js and css/invite.css together and redeploy. Stop new confirmations while reviewing any records created during the rollout. Restore only newly created, untouched Pending migration rows from the private backup after owner approval. Preserve actual individual acceptances and RSVP records; do not delete legitimate confirmations or blindly restore the entire sheet. Joint history remains unchanged throughout.
