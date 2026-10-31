# Personalized static invitations

Eight real invitations are configured in `js/invitation-data.js` using the complete letters supplied by the couple. There is no sample recipient data. Shared sponsor invitations are single records.

## Privacy and publication

This is a public static page, not secure authentication. All names, letters, signatures, and the configured reply address can be downloaded from the public JavaScript data file once deployed. Random URL identifiers only select a letter. `noindex` and absence from navigation do not guarantee privacy. Do not add confidential information. There is no public on-page recipient directory or index of invitation links.

Nothing is automatically deployed, sent, or recorded by the invitation feature. The existing GitHub Pages workflow publishes repository files when changes are pushed to its deployment branch, including the actual invitation data. Review the letters before publishing.

## Test locally

From the project directory run:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

If port 8000 is already serving this folder, reuse that server. Open each locally generated link supplied with the implementation. The format is `http://127.0.0.1:8000/invite.html?to=URL_IDENTIFIER`.

The `urlIdentifier` in each record is the value after `?to=`. The record's object key must match it. There is deliberately no published recipient-link directory in this guide. Missing, unknown, duplicate, or malformed records display an invitation-unavailable message. Refreshing a valid link returns to the envelope; opening state is not stored.

Check the recipient name, illustration, role heading, complete letter, original signature, question, and buttons. Try mobile widths 320, 375, 390, and 430px, tablet, and desktop. Opening by keyboard and reduced-motion settings are supported. Long letters scroll naturally.

## Configure response emails

In `js/invitation-data.js`, set `responseContact.address` to the actual address chosen to receive replies. Keep `method` set to `email`. No address has been invented or configured. Until then, the response links are inactive and a notice explains that the recipient should contact the sender directly.

When configured, both response links prepare properly encoded email drafts. Recipients must review and press Send in their own email app. Opening the draft does not confirm delivery, acceptance, or receipt. The website stores no response, and email replies do not authenticate the recipient. Devices need a configured email handler.

Role acceptance is separate from attendance RSVP. The wedding RSVP form is unchanged and currently has no connected submission service.

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

For a future groomsman, use `Groomsman`, `bow-tie`, and the appropriate question. For a future bridesmaid, use `Bridesmaid` and `bouquet`. Keep all content as plain text; the renderer handles paragraphs and bullet lists without interpreting HTML. Do not regenerate existing identifiers, or previously sent links will stop working.

After deployment, an invitation link uses `https://nicoandkaye.com/invite.html?to=URL_IDENTIFIER`. Deploying is a separate action; this implementation does not publish the links.

## Files

- `invite.html`: standalone page, noindex metadata, envelope, letter, and response controls.
- `css/invite.css`: isolated invitation layout, green envelope, artwork styles, and reduced-motion rules.
- `js/invitation-data.js`: eight complete records and reply-email configuration.
- `js/invite.js`: URL lookup, safe plain-text rendering, illustrations, animation, and email drafts.
- `INVITATIONS.md`: this guide.

Existing wedding sections, navigation, RSVP, gallery, and page-flip scripts are unchanged. No framework, backend, database, image dependency, or authentication service has been added.
