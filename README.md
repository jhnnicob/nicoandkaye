# Nico & Kaye Wedding Invitation

This is a static wedding invitation website designed to match the provided reference. The page is controlled mainly through [index.html](index.html) and [styles.css](styles.css).

## Where to edit the content

### 1) Couple names
Edit the names in [index.html](index.html):
- Hero title: the heading near the top of the page
- Closing section: the final signature line

### 2) Date, time, venue, and location
Edit the event details in [index.html](index.html):
- Hero event meta text
- Details section
- Closing section

### 3) Story text
Edit the paragraph in the story section in [index.html](index.html).

### 4) Gallery images
Replace the image sources in the gallery block in [index.html](index.html). The current images are in [assets](assets).

### 5) RSVP text
Update the RSVP section copy in [index.html](index.html). The existing form submits through [js/rsvp.js](js/rsvp.js); see [RSVP.md](RSVP.md) for the request contract, CORS limitations, and test procedure.

### 6) Colors and design palette
Edit the color variables in [styles.css](styles.css) near the top of the file:
- background colors
- text colors
- buttons
- accents
- shadows

### 7) Hero and background images
Change the background image in [styles.css](styles.css) for the hero and closing sections.

### 8) Typography
Adjust font families and sizing in [styles.css](styles.css) under the root variables and heading styles.

### 9) Main layout spacing
Edit spacing, margins, and section padding in [styles.css](styles.css).

### 10) Section text and labels
All visible copy is written directly in [index.html](index.html) and can be changed there without touching JavaScript.

### 11) Buttons and links
Update styling in [styles.css](styles.css) for the buttons and any link treatments.

### 12) Final wording and polish
Everything else, including personalization and final wording, is best adjusted in [index.html](index.html) and [styles.css](styles.css).

## Main files

- [index.html](index.html) – all page text, sections, and image sources
- [styles.css](styles.css) – all colors, layouts, spacing, typography, and section styling
- [assets](assets) – photos used in the invitation

## Run locally

From this folder, run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Quick note

Most of the personalization is done without JavaScript. If you want to change names, venue, date, text, or gallery photos, start with [index.html](index.html), then tweak the visual theme in [styles.css](styles.css).

## Gallery viewer

All gallery thumbnails and View More Photos use one shared book-flip album containing the featured photos and the full collection. Clicking a thumbnail opens its exact page; View More starts at the first additional photo. Swipe, drag, tap either half of a page, use the arrows below the book, or press the keyboard arrow keys to turn pages. Escape or tapping outside the dialog exits the album. The viewer uses narrow, equal outer margins on phones.

Gallery previews are served from `assets/gallery/previews/` with a maximum edge of 1600 pixels. Originals remain in `assets/gallery/`. After replacing a gallery photo, regenerate previews with `powershell -File scripts/build-gallery-previews.ps1`. The album keeps only nearby photos loaded, releases images on close, and allows retry after a load failure. Run `node --test tests/gallery.test.cjs` to verify preview dimensions, aspect ratios, and download sizes.


## Background music

The main wedding page and personalized invitations use the existing `assets/playlist/Palagi - By TJ.mp3` through one native HTML audio element per page. The shared player is `js/music.js`; its floating control is styled in `styles.css`. Keep the MP3 in the published site; no replacement track is generated.

The player initializes volume to 25%, enables looping, and requests metadata preload. It attempts playback once on load unless the visitor previously paused it. When autoplay is blocked, the control offers Tap to Play Music. A real Open Your Letter click can also start blocked playback without delaying the letter animation. Browser autoplay restrictions are respected; no muted-autoplay trick or global interaction trap is used. Device media volume remains subject to browser and OS behavior.

Manual pause is saved in localStorage under `nico-kaye-music` and respected on later pages/visits. Storage failures are handled without blocking the player. Music continues through same-page section navigation, gallery viewing, and form submissions. Full navigation between HTML documents loads a new page/player; seamless audio across separate documents is not claimed. The old page pauses on exit, and a back-forward-cache return resumes only when appropriate. A missing audio file offers an unobtrusive retry.

The music control uses native button keyboard behavior and accessible play/pause labels. It stays clear of RSVP/acceptance buttons and hides while a native dialog is open. Playback continues during dialogs. Close the dialog to access the music control again. Animations respect reduced motion.

Run `node --test tests/music.test.cjs` for mocked playback/persistence/placement checks. Real Chrome tests used hidden muted-output browser profiles with permitted and blocked autoplay policies. They verified actual MP3 playback at volume .25, end-of-track looping, one audio element, the mobile tap prompt, manual pause across navigation, invitation opening, same-page section navigation, a network-intercepted mock RSVP submission, reduced motion, gallery dialog placement, and failed-audio recovery. No live API response was submitted. Physical Safari/iOS and Android device testing is still recommended; browser emulation is not a substitute for those checks.
