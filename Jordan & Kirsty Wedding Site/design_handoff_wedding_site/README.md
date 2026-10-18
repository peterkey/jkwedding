# Handoff: Jordan & Kirsty — Wedding Website

## Overview
A single-page, responsive wedding website for **Jordan Nelson & Kirsty Williams**, marrying **Wednesday 31 May 2028, 3pm** at the **Atlantica Caldera Palace Hotel, Lyttos Beach, Heraklion, Crete, Greece**. Guests use it to see the schedule, travel/accommodation info, dress code, a photo gallery, and to RSVP.

Tone: warm and relaxed. Jordan works at M&S (UK) — the design carries a playful nod: a tight "J&K" monogram with an italic dusty-rose ampersand, and "This is not just any…" copy lines, plus a Percy Pig in the dietary placeholder. Keep these.

## About the Design Files
The files in this bundle are **design references created in HTML** — a prototype showing intended look and behaviour, not production code to ship. Recreate it in a suitable stack. No codebase exists yet; a good fit is a static site (e.g. Astro or Next.js static export, or plain HTML/CSS) deployed to Netlify/Vercel, with a small backend/form service for RSVPs.

To view the reference: open `Wedding Site.dc.html` in a browser (it needs `support.js` and `image-slot.js` alongside it, and loads Google Fonts). `image-slot.js` is a design-tool drag-and-drop photo placeholder — **replace with real `<img>` elements** in production.

## Fidelity
**High-fidelity.** Colours, typography, spacing, copy and interactions are final, except content marked TBC below. Recreate pixel-faithfully.

## Content still to confirm (placeholders in the design)
- Welcome drinks (Tue 30 May, 7pm, Pool terrace) and Recovery brunch (Thu 1 June, 11am, Beachfront) — times/venues are guesses
- RSVP deadline: 1 February 2028
- Airport transfer ~35 minutes (HER → Lyttos Beach)
- Links: "Directions from the airport", "Book at the hotel" (currently `#`)
- All photos (hero + 8 gallery)

## Page structure (single scrolling page)
Horizontal page padding everywhere: `clamp(22px, 5.6vw, 72px)`. Gap between sections: `clamp(96px, 12vw, 160px)` top padding. Layout is fluid; multi-column rows use `grid-template-columns: repeat(auto-fit, minmax(min(100%, Npx), 1fr))` so they stack on narrow screens.

### 1. Header / Nav
- Desktop (≥760px): row, `padding: 28px <page-pad>`, gap 32px. Left: monogram "J&K" (26px, weight 300, letter-spacing -0.05em; "&" italic #9c5f63). Right: text links "The days", "Travel & stay", "What to wear", "Gallery" (15px, ink, hover #9c5f63), then "RSVP" pill (15px, #9c5f63 text, 1px #c9a0a0 border, padding 9px 22px, radius 999px, hover bg #f6ecea).
- Mobile (<760px): `padding: 20px 22px`; monogram 22px; RSVP pill (14px, min-height 40px) + hamburger (two 22×1.5px ink bars, 44×44 hit area).
- Mobile menu: fixed full-screen overlay, bg #efe5d3, padding 20px 22px 32px. Top row monogram + "Close". Links stacked at 40px weight 300, letter-spacing -0.03em; "RSVP" italic #9c5f63. Footer line "Wednesday 31 May 2028 · Lyttos Beach, Crete" 15px #5e5348 pinned bottom.
- All nav items smooth-scroll to section anchors (`#home #days #travel #wear #gallery #rsvp`), offset 8px; menu closes on tap.

### 2. Hero (`#home`)
- Two columns (auto-fit, min 440px), gap `clamp(32px,4vw,48px)`, align end.
- Left: kicker "Together with their families" (uppercase, `clamp(11px,1.2vw,15px)`, letter-spacing 0.22em, #7d6643). Names on two lines: "Jordan" / "& Kirsty" — `clamp(80px,13vw,172px)`, weight 300, line-height 0.86, letter-spacing -0.045em; second line indented `clamp(40px,7.5vw,96px)`; "&" italic #9c5f63.
- Below: two info blocks (gap 24px 56px): label "When" (13px uppercase, 0.18em, #7d6643) → "Wednesday 31 May 2028"; label "Where" (#2c5a7a) → "Atlantica Caldera Palace / Lyttos Beach, Crete". Values `clamp(18px,1.8vw,22px)`.
- Right: portrait photo, height `clamp(400px,50vw,660px)`, **arch crop** (fully rounded top, square bottom — `clip-path: inset(0 round 2000px 2000px 0 0)`).

### 3. Countdown band
- Full-width bg #efe5d3, padding `clamp(28px,4.4vw,56px) <page-pad>`, two columns (min 360px).
- Left: "This is not just any countdown…" (`clamp(24px,3.1vw,40px)`, italic, weight 300; ellipsis #9c5f63) + "Counting down to 3pm on the 31st, Crete time." (16px #5e5348).
- Right: Days / Hours / Minutes / Seconds — numbers `clamp(44px,6.9vw,88px)`, weight 300, tabular nums, letter-spacing -0.04em; labels 12px uppercase 0.18em #5e5348. Days in #2c5a7a, Seconds in #9c5f63, others ink. Hours/min/sec zero-padded.
- Target: **2028-05-31T15:00 Europe/Athens (12:00 UTC)**; updates every second; clamps at 0.

### 4. Intro
- Two columns (min 400px), gap 24px 72px. Left H2 "We're getting married in Crete, *and we'd love you there.*" (`clamp(38px,5vw,64px)`, weight 300, lh 0.98; italic part #9c5f63). Right: two 18px/1.65 paragraphs (max-width 560px), RSVP date in bold.

### 5. The days (`#days`)
- Header row: "01" (15px italic #9c5f63) + H1 "Three days / by the sea" (`clamp(52px,8vw,104px)`, weight 300, lh 0.9, ls -0.04em); right intro paragraph 18px #4a423b.
- Three event rows (gap `clamp(48px,6vw,80px)`), each a wrapping flex row: [date label 13px uppercase + time `clamp(36px,4vw,52px)` w300] (180px) · [H2 `clamp(28px,3vw,38px)` w600 + 17px/1.65 description] (flex 1, basis 380px) · [venue italic + dress note, 15px #6b625b] (220px).
- The wedding day row uses #9c5f63 for date label and "3pm".

### 6. Travel & stay (`#travel`)
- "02" + H1 "Getting there / & where to stay".
- Two columns: **Flights** (label #2c5a7a) "Fly into Heraklion" + copy + link; **Accommodation** (label #2c5a7a) "Stay where the party is" + copy + link. Sub-heads `clamp(30px,3.4vw,44px)` w300.
- Callout panel: bg **#e2eaef**, padding `clamp(28px,4.4vw,56px)`. "Booked the hotel? *Keep your reference handy.*" (italic part #2c5a7a) + paragraph + button "Go to RSVP" (bg #2c5a7a, hover #1f4560, white text, 16px, padding 14px 30px, pill) → scrolls to RSVP.
- Three tips (min 260px): Time / Money / Passports (labels 15px italic #2c5a7a, body 17px/1.6).

### 7. What to wear (`#wear`)
- Left: "03", H1 "What / to wear", lead "Summer formal, Mediterranean-style." (`clamp(22px,2.2vw,28px)` italic), copy, and "Please leave white and champagne to the bride." (italic #9c5f63).
- Right: "A palette, if you'd like one" + 4 circles (4-col grid, aspect 1): Dusty rose #d9b8b5, Sand #c9b18a, Aegean #7c9db5, Olive #b7b9a0, 14px captions.
- Three notes: "25°", "*Heels*", "*Sun*" (`clamp(36px,4vw,52px)` w300) with 17px copy.

### 8. Gallery (`#gallery`)
- "04" + H1 "Us, so far" + intro paragraph.
- Grid `repeat(auto-fill, minmax(min(100%,240px),1fr))`, gap 20px, align end. 8 images alternating **arch (400px tall)** and **rectangle (320px tall)**: How we met (arch), First holiday, The proposal (arch), Friends, Family, A favourite (arch), Home, Just because (arch).

### 9. RSVP (`#rsvp`)
- Panel bg #efe5d3, padding `clamp(28px,5.6vw,72px)`, two columns (min 380px), gap 48px 64px.
- Left: "05", H1 "Save us / a seat & / say yes" (`clamp(52px,6.4vw,84px)`, "&" italic rose), note "Please reply by **1 February 2028**. One reply per guest, please. You can change it later."
- Form (gap 24px). Inputs: bg #fbf9f5, 1px #d9c6a3 border, radius 2px, padding 14px 16px, min-height 52px, 17–18px; labels 14px #4a423b.
  1. **Full name** (text, required)
  2. **Can you make it?** pill toggles "Wouldn't miss it" / "Sadly can't" (selected: bg/border #9c5f63, text #fbf9f5; unselected: bg #fbf9f5, border #d9c6a3; min-height 48px; padding 12px 24px)
  3. If attending:
     - **Arriving in Crete** / **Leaving** (date inputs, side by side; arrival min 2028-05-20 max 2028-06-05; leaving min 2028-05-28 max 2028-06-15)
     - **Staying at the Atlantica Caldera Palace?** toggles "Yes, booked" / "Somewhere else"
     - If yes: **Hotel booking reference** (text, border #c9a0a0, letter-spacing 0.04em, placeholder "From your hotel confirmation email") + helper "This lets the hotel link your room to the wedding party." (14px italic #7a4448)
     - **Dietary requirements** (textarea, placeholder "Vegetarian, nut allergy, a weakness for Percy Pigs…")
  4. Submit "Send our reply" (bg #9c5f63, hover #7a4448, active #5e3236, 17px, padding 16px 36px, pill)
- Validation: name required → border turns #9c5f63 and message "We'll need your name so we know who's coming." (14px italic #7a4448); clears on typing.
- Success state replaces the form: title `clamp(40px,4.8vw,64px)` w300 — attending: "Thank you, {first name}. See you in Crete!" / declining: "We'll miss you, {first name}." + body paragraph (see HTML for exact copy) + "Change my reply" link (returns to form with values kept).

### 10. Footer
- Wrap row, space-between, align end, padding `clamp(80px,9vw,112px) <page-pad> clamp(32px,4.4vw,56px)`. Left: "This is not just / any wedding." (`clamp(40px,5vw,64px)` w300; final "." italic #9c5f63). Right: monogram 30px + "31 · 05 · 2028 · Crete" 14px #6b625b.

## RSVP data model (to implement)
```
name: string (required)
attending: boolean
arrivalDate?: date        // if attending
departureDate?: date      // if attending
stayingAtHotel?: boolean  // if attending
hotelBookingRef?: string  // if stayingAtHotel — couple passes to hotel to link room to wedding party
dietary?: string          // if attending
submittedAt: timestamp
```
Needs persistence (e.g. Google Sheet / Airtable / Supabase), editable replies, ideally a confirmation email, and an export for the couple/hotel.

## Design tokens
**Colours**
- Paper / page bg `#fbf9f5`
- Ink (text) `#2b2623`
- Champagne (bands, panels, mobile menu) `#efe5d3`
- Champagne line / input border `#d9c6a3`; subtle rule `#e6dccb`
- Champagne text (kickers, labels) `#7d6643`
- Dusty rose (accent: ampersands, primary buttons, wedding-day highlight) `#9c5f63`; hover `#7a4448`; pressed `#5e3236`
- Dusty rose light (pill border) `#c9a0a0`; tint/hover `#f6ecea`; selection `#f0dcda`
- Aegean blue (links, travel labels, days count, "Where") `#2c5a7a`; hover `#1f4560`; tint panel `#e2eaef`
- Secondary text `#4a423b`, `#5e5348`, muted `#6b625b`
- Focus ring: 2px solid #9c5f63, offset 2px

**Type** — Source Serif 4 only (Google Fonts, variable: `ital,opsz,wght@0,8..60,300..700;1,8..60,300..700`), optical sizing on. Display uses weight 300 with tight negative letter-spacing (-0.03 to -0.045em); event titles weight 600; body 17–18px, line-height 1.6–1.65; kicker labels 12–13px uppercase, 0.16–0.22em tracking. No sans-serif anywhere. Section numerals "01–05" 15px italic rose.

**Shape** — inputs radius 2px; buttons/toggles fully rounded pills; photos arch or square; no shadows; sections separated by whitespace, not boxes or rules (except the hairline rows noted).

**Responsive** — fluid `clamp()` sizes throughout; nav switches to mobile at 760px; columns collapse via auto-fit grids; touch targets ≥44px.

## Assets
- Photos: none supplied yet — 1 hero portrait (arch), 8 gallery images (labels above).
- No icons; monogram is live text.

## Screenshots
`screenshots/` — `01–09-desktop.jpg` (hero → footer, in scroll order) and `01–04-mobile.jpg` (390px: hero, the days, RSVP, open menu). Striped blocks are photo placeholders.

## Files
- `Wedding Site.dc.html` — the final design reference (single page, all sections + RSVP logic in its script block).
- `support.js`, `image-slot.js` — only needed to open the reference in a browser; not part of production.
