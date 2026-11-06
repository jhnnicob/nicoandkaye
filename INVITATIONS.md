# Personalized static invitations

Sixteen real invitations are configured in `js/invitation-data.js` using the letters supplied by the couple. All sixteen use the exact name-based response IDs supplied in the current tracker. Previously shared URL aliases, letters, signatures, and questions are preserved. Shared sponsor invitations retain one letter and URL, with independent confirmation mappings for each spouse. See [COUPLE-CONFIRMATIONS.md](COUPLE-CONFIRMATIONS.md) for the required sheet preparation before deployment. One separate, clearly labeled test invitation has been added for Apps Script response testing; it is not a real recipient.

## Privacy and publication

This is a public static page, not secure authentication. All names, letters, signatures, and the configured reply address can be downloaded from the public JavaScript data file once deployed. Name-based URL identifiers only select a letter. `noindex` and absence from navigation do not guarantee privacy. Do not add confidential information. There is no public on-page recipient directory or index of invitation links.

Nothing is automatically deployed or submitted on page load. A response is submitted only when a recipient clicks an enabled response button. The existing GitHub Pages workflow publishes repository files when changes are pushed to its deployment branch, including the actual invitation data. Review the letters before publishing.

## Test locally

From the project directory run:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

If port 8000 is already serving this folder, reuse that server. Open each locally generated link supplied with the implementation. The format is `http://127.0.0.1:8000/invite.html?to=URL_IDENTIFIER`.

The `urlIdentifier` in each record is the value after `?to=`. The record's object key must match it. There is deliberately no published recipient-link directory in this guide. Missing, unknown, duplicate, or malformed records display an invitation-unavailable message. Refreshing a valid link returns to the envelope; opening state is not stored.

Check the recipient name, illustration, role heading, complete letter, original signature, question, and buttons. Try mobile widths 320, 375, 390, and 430px, tablet, and desktop. Opening by keyboard and reduced-motion settings are supported. Long letters scroll naturally.

## Google Sheets response API and test invitation

`responseApi.url` in `js/invitation-data.js` contains the Apps Script `/exec` endpoint supplied by the couple. Only records with an explicit `responseInvitationId` can submit to it. All sixteen real invitations are mapped to the exact name-based column-F IDs supplied in the tracker on November 5, 2026; obsolete UUID mappings have been replaced. Their existing invitation links and letters are unchanged. Pastor Año in the tracker maps to Pastor Año on the invitation; the API matches by ID, not name.

Test link on the requested LAN server:

http://192.168.1.28:5500/invite.html?to=test-_Vsxx1cjSi4LQxDJ

For the Python server on this computer use:

http://127.0.0.1:8000/invite.html?to=test-_Vsxx1cjSi4LQxDJ

Before clicking a response, create or verify a dedicated test row in **Wedding Role Responses**. Use an unused row at or after row 6, such as row 14 if free; do not overwrite a real recipient:

- Column A: `Test invitation`
- Column B: `Groomsman`
- Column D: `Pending`
- Column E: blank
- Column F: `test-wedding-2026`

That test ID comes from the sample submission function supplied with the Apps Script. The supplied tracker includes this dedicated test row. The website has not independently read or modified it. Clear its existing timestamp before repeating a clean test; do not change any real-recipient rows. If the ID already belongs to an answered test row, reset only that test row to `Pending` and clear its timestamp before repeating, or configure another dedicated test ID. Never reset a real recipient just to test.

Open the test link, open the letter, and click "Yes, I'd Love To!". The browser sends exactly one `{ type: "roleResponse", invitationId, response: "Accepted" }` request using the configured responseInvitationId. The deployed backend now records both role acceptance and attendance. Success is shown only after a readable JSON response with Boolean `success: true`; if a response type is included, it must be `roleResponse`. Confirm the role response and attendance records in their private sheets. No second weddingRSVP request is sent.

No live API POST was made during implementation or automated checks. Tests use mock responses and cannot verify the actual sheet mapping, deployment permissions, or browser CORS behavior.

The request uses JSON in a `text/plain` POST to avoid a JSON preflight. Redirects are followed. This still requires a CORS-readable response from the deployed Apps Script. Do not use `no-cors` or treat an opaque/network response as success. A timeout or network error may occur after a write; the website displays an unconfirmed-result message and disables another click until the sender checks the sheet.

For real recipients, add their exact column-F value as `responseInvitationId` in the corresponding record. Do not change `id`, `urlIdentifier`, names, or letters. Adding a public response ID is not authentication: visitors can inspect all frontend data and anyone with an ID may submit a pending response. Keep the spreadsheet itself private.

Recommended API improvements remain: explicitly open the spreadsheet by ID, guard against an empty data range, write D/E together, flush before releasing the lock, and make retries of the same recorded response idempotent. No remote Apps Script was changed by this implementation.

## Optional email fallback

To use email instead of the API, clear `responseApi.url`, then set `responseContact.address` to the actual reply address and keep `method` as `email`. No email address has been invented or configured. The email flow only prepares a draft; the recipient must send it. Opening a mail app does not confirm delivery.

Accepting a personalized entourage invitation now confirms both the role and wedding attendance through the backend roleResponse handler. The general attendance form retains its independent weddingRSVP handler and is unchanged by this update; see RSVP.md for that form's contract. Recipients accepting an entourage invitation do not need a second attendance submission.

## Add a bridesmaid or groomsman later

Only add a recipient when their actual name and complete letter are supplied. Choose a unique lowercase name-based ID, using hyphens for shared invitations or multiple words, for example `katrisse` or `cherry-bernabe`.

Add a record inside `invitations`. Copy an existing record's shape and set:

- `id`, `recipientId`, `urlIdentifier`, and the object key: the same unique name-based ID.
- `recipientName`: actual recipient display name.
- `role`: `Best Man`, `Maid of Honor`, `Bridesmaid`, `Groomsman`, `Principal Sponsor`, or `Principal Sponsors`.
- `completeLetter`: the entire exact letter as one string, including greeting, paragraphs, lists, and signature. Use `\n\n` between paragraphs and `\n` within a list or signature. List items begin with `? `.
- `signature`: the final paragraph exactly as it appears in `completeLetter`, including the closing line and sender.
- `sender`: the sender name used in the response email greeting.
- `designVariant`: `bow-tie`, `emerald-dress`, `bouquet`, `rings-olive`, `rings-flowers`, `rings-botanical`, or `rings-ivory`.
- `fullName` and `preferredGreeting`: confirmed identity and greeting; leave unknown full names null rather than guessing.
- `responseQuestion`: the exact question to show beneath the letter.
- `responseInvitationId`: the matching column-F ID, required only for Google Sheets responses. Never guess another recipient's ID.

For a future groomsman, use `Groomsman`, `bow-tie`, and the appropriate question. For a future bridesmaid, use `Bridesmaid` and `bouquet`. Keep all content as plain text; the renderer handles paragraphs and bullet lists without interpreting HTML. When changing an ID, add the old URL identifier to `aliases` with the new ID as its value so previously sent links keep working. Never rename `responseInvitationId`: it must match the existing spreadsheet record.

After deployment, an invitation link uses `https://nicoandkaye.com/invite.html?to=URL_IDENTIFIER`. Deploying is a separate action; this implementation does not publish the links.

## Files

- `invite.html`: standalone page, noindex metadata, envelope, letter, and response controls.
- `css/invite.css`: isolated invitation layout, green envelope, artwork styles, and reduced-motion rules.
- `js/invitation-data.js`: sixteen real records, one test record, centralized attire guides, and response configuration.
- `js/invite.js`: URL lookup, safe plain-text rendering, illustrations, animation, and email drafts.
- `INVITATIONS.md`: this guide.

Existing wedding sections, navigation, RSVP, gallery, and page-flip scripts are unchanged. No framework, backend, database, image dependency, or authentication service has been added.

## Entourage extension

Both `/invite/?to=RECIPIENT_ID` and previously sent `/invite.html?to=URL_IDENTIFIER` links use the same template. `invite/index.html` forwards the query to `invite.html`; no recipient-specific HTML pages are generated. Unknown, missing, or duplicate IDs show the existing safe fallback.

The eight additional letters reuse the exact wording and signatures supplied in the conversation. Only paragraph spacing and text emphasis are formatted. Arjay retains the Ops Solution / production / deployment / go-live letter. Katrisse and Katrine retain "your kuya Nico"; CJ retains "your Tita K". Zhalan, Katrisse, and Katrine include the supplied gown reminder. AJ and Krysnah do not. Sponsor postscript reminders have been removed at the couple's request; the original letters, signatures, and separate attire guides remain.

Each record provides `recipientId`, `recipientName`, `fullName`, `preferredGreeting`, `role`, `completeLetter`, `signature`, `attireGuide`, and `responseInvitationId`, alongside the existing renderer fields. `attireGuides` centralizes instructions and optional image metadata. The supplied attire PNGs were converted to JPEG at quality 90 without changing dimensions; the two images total about 211 KB. Images have alt text, explicit dimensions, lazy loading, and responsive sizing. Sponsor guides remain text-only because no sponsor sample images were supplied. Do not apply bridesmaid or groomsmen imagery to sponsors.

The new letters are configured under the IDs `zhalan`, `katrisse`, `katrine`, `krysnah`, `arjay`, `cj`, `ressie`, and `rjay`. These short IDs are URL selectors, not authentication. Their `responseInvitationId` values now match the name-based IDs in the supplied tracker, so all sixteen real acceptance controls are connected. The designated test record retains `test-wedding-2026`. Do not invent IDs or reuse another recipient's mapping. The endpoint and roleResponse request contract are unchanged by this mapping correction.

Review `recipientReviews` before sharing: Zhalan's supplied letter is for the Bride Squad, but the public roster lists Leine Zhalan Torres as Flower Girl. The invitation uses only the supplied name Zhalan and does not assume this is the same person. Confirm the identity and role; the public roster is unchanged. CJ's full name and AJ's full-name mapping also require confirmation. Do not infer these mappings from nicknames.

Run `node --test tests/invitations.test.cjs`. Tests use IDs parsed from the actual template, open all 17 records, check letter wording and attire exceptions, and mock API responses. No real responses are submitted. Browser checks were also performed in Chrome at widths 320, 375, 390, 430, 768, and 1440 px: content is centered, no horizontal overflow, images load, and buttons meet 44 px touch height. Safari and Android devices have not been directly tested.

## Consistent name-based IDs

All active records now use the same value for their object key, `id`, `recipientId`, and `urlIdentifier`. The IDs are `paul`, `ate-len`, `aj`, `cherry-bernabe`, `bhubbles`, `pastor-ano`, `emil-susan`, `ethel-michael`, `test`, `zhalan`, `katrisse`, `katrine`, `krysnah`, `arjay`, `cj`, `ressie`, and `rjay`. For example, use `/invite/?to=paul`.

The `aliases` map preserves all previously shared random URL identifiers and the old `katryn` spelling. Aliases resolve directly to one canonical record; letters are not duplicated. The API endpoint is unchanged. The current supplied tracker uses name-based `responseInvitationId` values for all real recipients; the separate test ID remains `test-wedding-2026`. These backend IDs are separate from the name-based page selectors and must continue matching the sheet exactly.

## Combined role and attendance confirmation

The shared invitation button is labeled "Yes, I'd Love To!" and explains: "By accepting this invitation, you also confirm your attendance at our wedding." The note is linked to the button with aria-describedby. Existing letters, styles, recipient names, backend response identifiers, and endpoint configuration are unchanged. Records without a configured responseInvitationId remain disabled; name-based URL IDs are never substituted for spreadsheet IDs.

Request:

```json
{"type":"roleResponse","invitationId":"<configured responseInvitationId>","response":"Accepted"}
```

Only one POST is sent. Both sheet updates are the deployed backend's responsibility. The frontend does not call weddingRSVP, infer a guest count, update attendance separately, or claim success on page load. A readable HTTP-success JSON acknowledgment with Boolean success: true is required before displaying the combined role/attendance confirmation. It relies on the supplied backend contract that success means both updates completed; the backend source was not inspected or modified.

Buttons lock during submission and stay locked after confirmation, an already-answered response, or an uncertain network/CORS result. Unknown invitation IDs keep the existing retry behavior. No automatic POST retries are performed. An unconfirmed result asks the recipient to contact the couple rather than submit again, because either sheet may already have been written. The optional unconfigured email fallback only prepares a draft asking the couple to confirm both outcomes; it never shows a saved confirmation.

The existing fetch path uses cors, omit credentials, follows redirects, and submits JSON as text/plain. It never uses no-cors or treats opaque responses as success. Live browser CORS and the backend's two-sheet persistence were not verified by a real submission. Automated requests are mocked. If the acknowledgment cannot be read from the static site's origin, the smallest reliable fallback is a POST-only same-origin serverless route such as /api/role-response hosted through an edge/function service. GitHub Pages alone cannot execute this route. It must validate and forward only the roleResponse payload to the fixed Apps Script endpoint, follow redirects server-to-server, return a verified acknowledgment, and expose no sheet rows. No proxy or hosting change has been implemented.

Before sending real invitations, use the designated test recipient only:

1. Confirm that its configured backend ID matches a dedicated pending test record and the backend can map that test record to attendance. Never reset or reuse a real recipient.
2. Open /invite/?to=test in a browser with Network tools. Click Yes once and immediately click again. Verify exactly one POST with type roleResponse, response Accepted, and the unchanged test backend ID. No weddingRSVP request should appear.
3. Verify that the UI does not confirm either outcome while pending. After a readable success: true response, it should confirm both role and attendance using the recipient's name.
4. Inspect both private sheets: the test role must be accepted and its attendance confirmed exactly once. For shared sponsor records, confirm the backend's intended handling without inventing client-side counts or extra requests.
5. Test a mocked network failure/non-JSON/opaque response with node --test tests/invitations.test.cjs. These must never show combined success, and uncertain outcomes must remain locked to prevent duplicate writes. If a real browser reports CORS, inspect both sheets before considering any retry.
6. Confirm that the main Your Reply form and js/rsvp.js remain unchanged. Remove only dedicated test data after validation.

## Tracker mapping correction

The tracker supplied on November 5, 2026 lists the real recipient IDs as the same name-based values used by the current canonical URLs. All 16 responseInvitationId values were matched to column F, checking the role in column B. This fixes the client sending obsolete UUIDs, which the current sheet could not find. No live API POST or spreadsheet change was made.

The supplied test row is already Accepted. Do not use it expecting a new acceptance to succeed unless the owner deliberately resets only that dedicated test row or supplies a separate pending test ID. The copied CJ line also contains test data outside the normal A-G columns; only the first seven tracker columns were used for mapping, so those trailing cells did not become recipient IDs.

## Recipient-ID submission audit

The local and live invitation configuration were checked without submitting any real response. All 16 real invitation response IDs match the supplied name-based column-F list. The value test-wedding-2026 exists only in the dedicated test configuration record, not as a hardcoded ID or fallback in the production submission handler.

The lookup path is: URL to parameter -> optional legacy alias -> canonical invitation record -> record.responseInvitationId -> currentRecipientId -> the POST invitationId field. The displayed name comes from that same selected record but is never used as the API ID. The request remains exactly `{type: "roleResponse", invitationId: currentRecipientId, response: "Accepted"}`. No weddingRSVP request is sent by the invitation flow.

No current frontend ID-routing root cause was found. Prior old-UUID mappings have already been corrected. A real-recipient-only failure cannot be attributed to a hardcoded test ID based on this code. A failed POST response body or server lookup diagnostics are still needed to identify the remaining backend/record-specific failure. A read-only health GET reported a missing doGet function; that identifies a deployment difference from the supplied complete replacement, but does not by itself establish whether doPost works.

The minimal frontend hardening preserves ID mappings and design. A response containing a different invitationId is rejected instead of confirming the displayed recipient. Known backend failures such as invalid existing status, duplicate IDs, conflicting attendance, and missing backend configuration now show safe, specific explanations. Unknown responses remain unconfirmed and locked; no arbitrary server exceptions or spreadsheet contents are echoed. No backend or sheet records were changed.

Regression tests mock every canonical recipient and all legacy aliases, verify the displayed name and exact outgoing ID, verify that changing a display name cannot change its ID, and verify that a missing mapping cannot fall back to the test ID. Test acknowledgments cannot confirm real recipients, or vice versa. No automated test contacts the deployed endpoint or accepts a real guest.
