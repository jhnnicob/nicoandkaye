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
Update the RSVP section copy in [index.html](index.html).

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