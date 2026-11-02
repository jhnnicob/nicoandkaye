# Personalized static invitations

Eight real invitations are configured in `js/invitation-data.js` using the complete letters supplied by the couple. Shared sponsor invitations are single records. One separate, clearly labeled test invitation has been added for Apps Script response testing; it is not a real recipient.

## Privacy and publication

This is a public static page, not secure authentication. All names, letters, signatures, and the configured reply address can be downloaded from the public JavaScript data file once deployed. Random URL identifiers only select a letter. `noindex` and absence from navigation do not guarantee privacy. Do not add confidential information. There is no public on-page recipient directory or index of invitation links.

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

Only add a recipient when their actual name and complete letter are supplied. Generate a new random URL identifier locally, for example:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(18))"
python -c "import uuid; print(uuid.uuid4())"
```

Add a record inside `invitations`. Copy an existing record's shape and set:

- `id`: a new UUID, not the URL identifier.
- `recipientName`: actual recipient display name.
- `role`: `Best Man`, `Maid of Honor`, `Bridesmaid`, `Groomsman`, `Principal Sponsor`, or `Principal Sponsors`.
- `completeLetter`: the entire exact letter as one string, including greeting, paragraphs, lists, and signature. Use `\n\n` between paragraphs and `\n` within a list or signature. List items begin with `? `.
- `signature`: the final paragraph exactly as it appears in `completeLetter`, including the closing line and sender.
- `sender`: the sender name used in the response email greeting.
- `designVariant`: `bow-tie`, `emerald-dress`, `bouquet`, `rings-olive`, `rings-flowers`, `rings-botanical`, or `rings-ivory`.
- `urlIdentifier`: the generated identifier, also used as the record's object key.
- `responseQuestion`: the exact question to show beneath the letter.
- `responseInvitationId`: the matching column-F ID, required only for Google Sheets responses. Never guess another recipient's ID.

For a future groomsman, use `Groomsman`, `bow-tie`, and the appropriate question. For a future bridesmaid, use `Bridesmaid` and `bouquet`. Keep all content as plain text; the renderer handles paragraphs and bullet lists without interpreting HTML. Do not regenerate existing identifiers, or previously sent links will stop working.

After deployment, an invitation link uses `https://nicoandkaye.com/invite.html?to=URL_IDENTIFIER`. Deploying is a separate action; this implementation does not publish the links.

## Files

- `invite.html`: standalone page, noindex metadata, envelope, letter, and response controls.
- `css/invite.css`: isolated invitation layout, green envelope, artwork styles, and reduced-motion rules.
- `js/invitation-data.js`: eight complete records and reply-email configuration.
- `js/invite.js`: URL lookup, safe plain-text rendering, illustrations, animation, and email drafts.
- `INVITATIONS.md`: this guide.

Existing wedding sections, navigation, RSVP, gallery, and page-flip scripts are unchanged. No framework, backend, database, image dependency, or authentication service has been added.
