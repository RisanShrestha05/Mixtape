# Mixtape — Design Direction

## Ground-truth reference

The supplied screenshots are the visual source of truth. The implementation should preserve their pale lavender field, centered narrow composition, black-and-white retro cassette object, handwritten/monospace editorial typography, white header strip, three-step progress markers, simple rounded controls, paper note, and generous breathing room. The creator journey is intentionally intimate and quiet rather than dashboard-like.

The user explicitly requested these deviations from the original README: omit the style customization step entirely; remove all note word limits and word-count messaging; keep the note visible and positioned outside/above the cassette rather than hidden behind it; and make song identification/search case-insensitive so a query beginning with either upper- or lower-case words behaves the same.

## Chosen Approach: Analog Love Letter

### Design Movement
A reference-faithful blend of late-1970s mixtape ephemera, photocopied zine typography, and soft editorial minimalism. The interface should feel like a small paper object passed between two people, with digital interactions tucked inside familiar tactile cues.

### Core Principles
1. **Paper first:** surfaces resemble stationery, cassette labels, and print artifacts rather than generic UI cards.
2. **Quiet intimacy:** the composition stays narrow and unhurried; small labels and generous whitespace carry the emotion.
3. **Functional nostalgia:** controls are contemporary and accessible, but their shapes and copy echo handwritten instructions and cassette hardware.
4. **Clarity through contrast:** near-black ink, warm paper, and a single green confirmation color keep the retro treatment legible.

### Color Philosophy
The base lavender (#d9d6eb) is a calm envelope for the experience: soft enough to feel personal, cool enough to let paper and ink read clearly. Warm paper (#f5f3e9) and off-white (#fcfbf8) hold the note and song list. Ink black (#141513) provides the visual anchor. The signature green (#45b85c) is reserved for completed steps and successful sharing, so it means “this is ready to pass along.”

### Layout Paradigm
Use a centered, narrow “desk object” composition on desktop with a strong vertical rhythm. The header is a white strip; the active experience sits in a lavender workroom. Content stacks around one central cassette/paper assembly, with the note deliberately offset or surfaced so it never disappears beneath the cassette. On wider screens, secondary context such as the playlist queue or link panel can sit in a slim side rail, but the main object remains the visual focus. On mobile, everything collapses into a single tactile column.

### Signature Elements
- A black cassette illustration built in CSS with label lines, reels, window, and tape details.
- A torn-edge paper note with ruled lines and visible handwritten-style copy.
- A three-stop progress rail with completed green discs and a soft current-state disc.

### Interaction Philosophy
Every action should feel like handling a keepsake: add a song with a small lift, remove it with a gentle slide, move through steps with a clear “Next” rhythm, and expose the share link as a finished object rather than a technical token. Errors should sound like a helpful handwritten correction, never like a system alarm.

### Animation
Use short, tactile transitions under 260ms: buttons compress slightly on press, cassette details settle with a tiny translate/rotate, and step changes fade/slide by 8–12px. Search results cascade lightly at 35ms intervals. The finished shared view may use one slow floating paper motion, but it must be disabled under `prefers-reduced-motion`. Do not animate layout dimensions or create constant motion.

### Typography System
Use `Special Elite` for the display wordmark and step headings to echo a typewriter label. Use `DM Sans` for readable interface copy and controls. Use `Caveat` sparingly for the note and personal annotations. Headings are compact, dark, and slightly tracked; body copy stays calm and high-contrast. The brand wordmark is split into a typewriter “Mixtape” line with an italic handwritten “for you” accent, matching the supplied header.

### Brand Essence
A tiny digital mixtape for people who would rather send a song than explain the feeling. Personality: **tender, tactile, quietly playful**.

### Brand Voice
Headlines are direct and personal. CTAs sound like an invitation to make something, never like software onboarding. Microcopy is warm, specific, and lightly handwritten.

Example lines:
- “Some songs say what words can’t.”
- “Put a little feeling on a tape.”

### Wordmark & Logo
The wordmark is a two-line lockup: “Mixtape” in a rough typewriter face above “for you” in a slanted handwritten face. The supporting mark is a small tape-reel glyph formed from two offset circles and a rectangular label window; it can stand alone as the favicon and compact app mark.

### Signature Brand Color
**Cassette green — #45B85C.** It belongs only to completion, ready-to-share states, and the occasional tiny audio-status accent.

## Implementation boundaries

This is a frontend-only React/Vite experience with no accounts, backend, or database. Share links carry a compact encoded playlist payload plus a cryptographically strong random identifier. Song search uses a public catalog endpoint and normalizes queries with case-insensitive matching; curated fallback results keep the interaction demonstrable when the network is unavailable. Playback uses permitted preview/audio URLs only and never downloads or proxies copyrighted music.

The creator flow is: landing → add songs → write note → review/share. The recipient flow is: random share URL → decoded mixtape → visible note and playlist player. The song cap remains 8 as specified by the README; the note is unrestricted per the user’s request.

## Style Decisions

- The screenshots override the original README wherever they conflict with the user’s requested behavior.
- No customization UI is present in the shipped experience.
- No note word count, counter, or maximum is shown or enforced.
- The note is a first-class visible layer above/adjacent to the cassette, never covered by it.
- Song matching trims whitespace and compares lower-cased text so capitalization never changes identification.
- Share identifiers use secure browser randomness and are never sequential or derived from user content.


## Reference Ground Truth — Desktop-1 Landing Page

This request is a visual replication task. The supplied Desktop-1 image overrides alternative design directions for the landing route.

The landing page must use a white header band with the centered “Mixtape / for you” wordmark. Below it, the main canvas is a pale dusty lavender with a single centered vertical composition. The hero artwork is a black-and-cream cassette tilted slightly over a torn ruled note, with a colorful ransom-letter “PLAYLIST” accent across the upper-right edge. The page includes the handwritten note line “I made this for you <3.”, the quote “Some songs say what words can’t.” in muted dark gray below the collage, and one centered black rounded CTA labeled “Create a mixtape”. The composition is deliberately spacious, with the collage occupying the upper-middle of the page and generous lavender negative space below. The creator and recipient routes remain functional and are not visually redesigned by this change.
