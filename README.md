# Mixtape for You

A web app where you build a playlist of YouTube songs, write a personal note, and send it to someone special as a single shareable link, styled like a retro cassette tape.

---

## Project purpose

Mixtape allows one person to create a small playlist for their significant other or another recipient. The creator pastes exact YouTube song links, writes a personal note, reviews the result, and generates a shareable URL. The recipient opens that URL and is taken directly to a playlist player where they can read the note and play the selected tracks.

The application is intentionally frontend-only. It does not use accounts, authentication, a server database, or a persistent playlist API. The shared URL contains the information required to reconstruct the mixtape.

---

## Technology fundamentals

The application uses the following technology stack:

| Technology | Purpose |
|---|---|
| React 19 | Component-based user interface and state management |
| Vite | Development server and production build tooling |
| JavaScript/JSX | Application logic and component markup |
| CSS3 | Visual design, responsive behavior, animation, and tactile styling |
| Lucide React | Accessible interface icons |
| YouTube oEmbed + official iframe player | Video metadata lookup and full-song playback through YouTube |
| Browser iframe support | Playback through the official YouTube embed player |
| Browser Web Crypto API | Secure random share-link identifiers |

The application source is implemented entirely with JavaScript and JSX. It has no backend routes, database, authentication system, or server-side playlist storage.

---

## Design reference and decisions

The supplied screenshots were treated as the visual source of truth. The implementation follows their key characteristics:

- Pale lavender background and white header strip.
- Narrow, centered content composition.
- Black and off-white retro cassette styling.
- Ruled stationery and torn-paper details.
- Typewriter-style display typography.
- Handwritten script accents for intimate copy.
- Three-step progress indicator.
- Rounded black primary buttons and white secondary buttons.
- Quiet spacing and a tactile, personal tone.

The chosen design direction is **Analog Love Letter**. It combines late-1970s mixtape ephemera, photocopied zine typography, warm stationery, and soft editorial minimalism.

The design system uses:

| Design element | Implementation |
|---|---|
| Lavender field | `#D9D6EB` |
| Paper surface | `#F7F5EB` and `#FCFBF8` |
| Ink | `#151614` |
| Completion color | Cassette green `#45B85C` |
| Display font | Special Elite |
| Interface font | DM Sans |
| Handwritten font | Caveat |
| Primary visual object | Retro cassette with label lines, reels, tape window, and D90 details |
| Supporting visual object | Ruled paper note with torn edge and handwritten copy |

The design intentionally avoids generic dashboards, excessive gradients, uniform cards, and a purely centered application layout. It uses asymmetry on larger screens and a single tactile column on mobile.

---


## How it works

For the creator, there are three steps:

-Add songs. Paste YouTube links (watch, youtu.be, Shorts, live, or embed formats). The app identifies the exact video and shows its title, channel, and thumbnail. If those details can't be loaded, the song is still kept with a simple fallback label. Using exact links avoids confusion between same-named songs, remixes, and live versions.
-Write a note. A ruled-paper editor with handwritten-style text and no word limit. The note can't be empty, but it can be as long as you like, and line breaks are preserved.
-Review and share. Check the note, cassette preview, and track list, then press Create share link.

For the recipient, opening the link goes straight to the player, with no creator screens first. They see:

The personal note on its own paper card.
A cassette-style player with play/pause, previous, next, elapsed time, duration, and a progress slider.
The full track list, where any track can be selected and the queue advances automatically.
A Watch on YouTube link and a Copy link button.

Only the audio experience is shown. The video itself stays hidden behind the cassette player.

## Rules and behavior

-Maximum of eight songs. The count shows as 1 / 8, and add controls are disabled at eight.
-No duplicates. A song already added shows as Added.
-Removal. Any song can be removed before sharing.
-Order is preserved. Songs play in the order they were added.
-Validation. Next stays disabled until at least one song and a non-empty note exist.

## Link behavior

-Each link is unique and randomly generated, not based on names or songs.
-Opening a valid link takes the recipient directly to the player.
-A broken or incomplete link shows a friendly "this tape couldn't be read" page with a button to create a new mixtape.
-Anyone who has the full link can see the note and playlist, so avoid sensitive information in notes.
---


## Share-data fundamentals

The application uses the URL as its persistence mechanism because there is no backend database.

---

## Known frontend-only limitations

Because this project does not use a backend or database:

- A playlist exists through its share URL only.
- There is no server-side playlist editing after a link is created.
- Anyone who possesses the complete URL can view the note and playlist.
- External music catalogs and preview URLs may change or become unavailable.
- Playback depends on the permissions and availability of the underlying source.
- The app does not host full copyrighted songs.
- The app does not provide accounts, saved libraries, analytics dashboards, or playlist recovery.

These limitations follow the original frontend-only technical direction.

