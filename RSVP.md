# Wedding attendance RSVP integration

The existing Your Reply form in `index.html` is handled by `js/rsvp.js`. Its HTML, styles, input values, labels, and validation accessibility are preserved. This is separate from `js/invite.js` and the entourage Wedding Role Responses workflow.

## Request and acknowledgment

The handler posts to the supplied Apps Script `/exec` endpoint. It sends JSON inside a `text/plain;charset=UTF-8` body using `mode: "cors"`, `credentials: "omit"`, and `redirect: "follow"`. Plain text avoids an application/json preflight; it does not bypass response CORS checks. ContentService redirects to script.googleusercontent.com, so following redirects is necessary: https://developers.google.com/apps-script/guides/content#redirects

Payload:

```json
{
  "type": "weddingRSVP",
  "guestName": "TEST RSVP - unique test name",
  "attendance": "Attending",
  "guestCount": 1,
  "message": "",
  "invitationId": ""
}
```

`accepts` maps to `Attending` / 1; `declines` maps to `Not Attending` / 0. The name is trimmed and must not be empty. Attendance must match a known option. No role invitation ID is inferred from the page URL, and no guest records are requested or displayed.

Success requires an HTTP-success response containing readable JSON with the Boolean `success: true`. If a response includes `type`, it must be `weddingRSVP`. The existing backend must dispatch requests with `type: weddingRSVP` to the attendance handler and return success only after saving the record. Its source was not provided or modified, so server routing and persistence must be verified with the procedure below. An HTTP 200, a redirect, an HTML sign-in page, or an opaque/unreadable response alone is never success.

The button and form fields lock during submission. The request times out after 20 seconds. Repeated clicks and resubmission of the last confirmed payload in the same page session are blocked. Editing guest details allows another submission. This is not a cross-device or refresh-proof deduplication guarantee; that requires backend support. The client never automatically retries a POST.

An explicit `success: false` gets a friendly failure message and permits retry. Network, timeout, malformed JSON, HTTP errors, or unreadable CORS responses are reported as unconfirmed: a write may already have happened. Controls restore, but the message asks the guest to check with the couple before trying again. The implementation never asserts that an uncertain request saved nothing.

## Hosting and CORS fallback

The repository's `.github/workflows` deployment publishes static files to GitHub Pages. GitHub Pages cannot execute a serverless proxy; see https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site . No extra service or deployment configuration is introduced by this change.

Direct submission works only if the deployed Apps Script redirect chain finishes with a response the browser can read from the site origin. This was not tested against the live endpoint: automated checks mock the network and do not create guest records. Verify both the production website and local origin if you use both.

If a test writes a row but the browser reports a CORS error, do not use `no-cors`, hidden forms, or JSONP to claim success. The smallest practical fallback is a small serverless function exposed at a same-origin route such as `https://nicoandkaye.com/api/rsvp` through an edge routing/hosting service while continuing to serve static content. A function file added only to GitHub Pages will not execute. Additional service/domain routing setup is required before switching the frontend URL.

That function should accept only POST, validate/allowlist the six attendance fields, require `type: weddingRSVP`, forward to the fixed Apps Script endpoint server-to-server, follow ContentService redirects, and return success only after parsing the upstream acknowledgment. It must not become an open proxy or return guest rows, spreadsheet contents, credentials, or raw server errors. Backend idempotency would also be needed before automatically retrying uncertain writes. No proxy has been created or deployed.

## Manual test procedure

1. Preview the updated site locally (`python -m http.server 8000`, then `http://127.0.0.1:8000/index.html#rsvp`) or deploy and open `https://nicoandkaye.com/#rsvp`. Use browser Network tools with Preserve log enabled. Keep the Wedding RSVP sheet private and open it separately as its owner.
2. Submit an empty form. Both validation messages should appear, focus should move to the missing field, and no POST should be sent.
3. Enter a dedicated name such as `TEST RSVP - ACCEPT - <timestamp>`, choose Joyfully accepts, and click Send RSVP once. Verify the outgoing request has the exact six fields above with `type: weddingRSVP`, `attendance: Attending`, and `guestCount: 1`. Name, radio buttons, and the submit button should be disabled while sending. Rapid additional clicks must not create another request.
4. Follow the redirect in Network tools. Verify that the final response is readable JSON with `success: true` (and `type: weddingRSVP` if supplied). Only then should the UI say the RSVP has been recorded.
5. In the private Wedding RSVP sheet, confirm exactly one record with the test name, Attending, guest count 1, and blank message/invitation ID. Do not assume column positions; inspect the backend's actual attendance sheet schema. Confirm no Wedding Role Responses row changed.
6. Use a different dedicated name `TEST RSVP - DECLINE - <timestamp>`, choose Regretfully declines, and verify `Not Attending` / 0 in both the request and sheet. Again verify the response before accepting the UI confirmation as correct.
7. After confirmed success, pressing Enter or clicking again without editing must not send another request. Reopening the page is outside the in-memory duplicate protection.
8. Before submitting another unique test name, set browser Network tools to Offline. Submission must show an unconfirmed error, never success, and restore the controls. Go online, check the sheet for that unique test name before manually retrying. For an explicit server rejection or malformed response, use the mocked tests below rather than altering the production backend.
9. If the browser cannot read the response because of CORS, inspect the sheet first: the request may have saved a row. Do not repeatedly click Retry to diagnose it. Use the proxy approach above if a browser-readable acknowledgment cannot be provided by the current deployment.
10. Remove only the dedicated test records after verifying both attendance options. Never use an existing real guest to test or reset entourage responses.

## Automated checks

Run:

```powershell
node --test tests/rsvp.test.cjs tests/invitations.test.cjs
```

RSVP tests cover invalid inputs, both attendance mappings, exact payload and request options, pending/confirmed duplicate prevention, explicit rejections, wrong response type, non-JSON responses, HTTP/opaque/network failures, timeouts, manual retries, and accessible field validation. Every request is mocked. They do not prove the live Apps Script supports the new type, writes to the correct sheet, or returns CORS-readable acknowledgments. Those checks require the manual test above.
