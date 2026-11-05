# Personalized static invitations

Sixteen real invitations are configured in `js/invitation-data.js` using the letters supplied by the couple. The original eight retain their existing URLs, signatures, questions, and response IDs; eight additional letters open for review while awaiting response mappings. Shared sponsor invitations are single records. One separate, clearly labeled test invitation has been added for Apps Script response testing; it is not a real recipient.

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

`responseApi.url` in `js/invitation-data.js` contains the Apps Script `/exec` endpoint supplied by the couple. Only records with an explicit `responseInvitationId` can submit to it. All eight real invitations are mapped to the exact column-F IDs supplied in the tracker. Their existing invitation links and letters are unchanged. Pastor Año in the tracker maps to Pastor Año on the invitation; the API matches by ID, not name.

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

Open the test link, open the letter, and click Accept or Decline. The browser sends `{ invitationId, response }`, with `response` equal to `Accepted` or `Declined`. Success is shown only after a readable JSON response with `success: true`. Confirm column D and E in the sheet. Reset the test row before checking the other response because the supplied API permits only one answer.

No live API POST was made during implementation or automated checks. Tests use mock responses and cannot verify the actual sheet mapping, deployment permissions, or browser CORS behavior.

The request uses JSON in a `text/plain` POST to avoid a JSON preflight. Redirects are followed. This still requires a CORS-readable response from the deployed Apps Script. Do not use `no-cors` or treat an opaque/network response as success. A timeout or network error may occur after a write; the website displays an unconfirmed-result message and disables another click until the sender checks the sheet.

For real recipients, add their exact column-F value as `responseInvitationId` in the corresponding record. Do not change `id`, `urlIdentifier`, names, or letters. Adding a public response ID is not authentication: visitors can inspect all frontend data and anyone with an ID may submit a pending response. Keep the spreadsheet itself private.

Recommended API improvements remain: explicitly open the spreadsheet by ID, guard against an empty data range, write D/E together, flush before releasing the lock, and make retries of the same recorded response idempotent. No remote Apps Script was changed by this implementation.

## Optional email fallback

To use email instead of the API, clear `responseApi.url`, then set `responseContact.address` to the actual reply address and keep `method` as `email`. No email address has been invented or configured. The email flow only prepares a draft; the recipient must send it. Opening a mail app does not confirm delivery.

Role acceptance remains separate from attendance RSVP. The wedding RSVP form is unchanged and currently has no connected submission service.

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

The new letters are configured under the IDs `zhalan`, `katrisse`, `katrine`, `krysnah`, `arjay`, `cj`, `ressie`, and `rjay`. These short IDs are URL selectors, not authentication. Their `responseInvitationId` values are null until the exact matching column-F IDs are supplied. Their letters open, but accept/decline buttons stay disabled and explain how to arrange a response. Do not invent IDs or reuse another recipient's mapping. Existing real recipients and the designated test record retain their response mappings. The API contract and duplicate-submission safeguards are unchanged.

Review `recipientReviews` before sharing: Zhalan's supplied letter is for the Bride Squad, but the public roster lists Leine Zhalan Torres as Flower Girl. The invitation uses only the supplied name Zhalan and does not assume this is the same person. Confirm the identity and role; the public roster is unchanged. CJ's full name and AJ's full-name mapping also require confirmation. Do not infer these mappings from nicknames.

Run `node --test tests/invitations.test.cjs`. Tests use IDs parsed from the actual template, open all 17 records, check letter wording and attire exceptions, and mock API responses. No real responses are submitted. Browser checks were also performed in Chrome at widths 320, 375, 390, 430, 768, and 1440 px: content is centered, no horizontal overflow, images load, and buttons meet 44 px touch height. Safari and Android devices have not been directly tested.

## Consistent name-based IDs

All active records now use the same value for their object key, `id`, `recipientId`, and `urlIdentifier`. The IDs are `paul`, `ate-len`, `aj`, `cherry-bernabe`, `bhubbles`, `pastor-ano`, `emil-susan`, `ethel-michael`, `test`, `zhalan`, `katrisse`, `katrine`, `krysnah`, `arjay`, `cj`, `ressie`, and `rjay`. For example, use `/invite/?to=paul`.

The `aliases` map preserves all previously shared random URL identifiers and the old `katryn` spelling. Aliases resolve directly to one canonical record; letters are not duplicated. Existing `responseInvitationId` values and the API endpoint remain unchanged. These backend IDs are separate from the name-based page selectors and must continue matching the sheet exactly.
