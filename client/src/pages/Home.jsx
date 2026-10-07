import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Headphones,
  Link as LinkIcon,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Youtube,
  Share2,
  Trash2,
  Volume2,
  X,
} from "lucide-react";

const EMPTY_DRAFT = { songs: [], note: "" };

function createRandomId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 18);
}

function encodeShare(data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...Array.from(bytes.subarray(index, index + 0x8000)));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeShare(payload) {
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function readSharedFromLocation() {
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments[0] !== "m" || !segments[1] || !segments[2]) return null;
  try {
    const payload = decodeShare(segments.slice(2).join("/"));
    if (!payload || !Array.isArray(payload.songs) || payload.songs.length > 8) return null;
    if (typeof payload.note !== "string") return null;
    const songs = payload.songs.filter((song) => song && typeof song.title === "string");
    if (songs.length !== payload.songs.length) return null;
    return { ...payload, id: segments[1], songs };
  } catch {
    return null;
  }
}

function isMixtapePath() {
  return window.location.pathname.split("/").filter(Boolean)[0] === "m";
}

function isCreatePath() {
  return window.location.pathname === "/create";
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const helper = document.createElement("textarea");
  helper.value = text;
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.appendChild(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
}

function extractYouTubeId(value) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    let id = "";
    if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v") || "";
      else if (/^\/(shorts|embed|live)\//.test(url.pathname)) id = url.pathname.split("/")[2] || "";
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
  } catch {
    return "";
  }
}

function youtubeUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

async function createYouTubeSong(rawUrl) {
  const videoId = extractYouTubeId(rawUrl);
  if (!videoId) throw new Error("Paste a valid YouTube link, like youtube.com/watch?v=…");

  const canonicalUrl = youtubeUrl(videoId);
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`);
    if (!response.ok) throw new Error("Metadata unavailable");
    const metadata = await response.json();
    return {
      id: videoId,
      videoId,
      title: metadata.title || "YouTube video",
      artist: metadata.author_name || "YouTube",
      album: "YouTube",
      artwork: metadata.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      previewUrl: "",
      sourceUrl: canonicalUrl,
      source: "youtube",
    };
  } catch {
    return {
      id: videoId,
      videoId,
      title: "YouTube video",
      artist: "Added from YouTube",
      album: "YouTube",
      artwork: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      previewUrl: "",
      sourceUrl: canonicalUrl,
      source: "youtube",
    };
  }
}

function Logo() {
  return (
    <div className="brand-lockup" aria-label="Mixtape for you">
      <div>
        <div className="wordmark">Mixtape</div>
        <div className="wordmark-script">for you</div>
      </div>
    </div>
  );
}

function Header({ onHome, action }) {
  return (
    <header className="site-header">
      <button className="brand-button" onClick={onHome} aria-label="Return to Mixtape home">
        <Logo />
      </button>
      {action}
    </header>
  );
}

function TapeGraphic({ compact = false }) {
  return (
    <div className={`tape-graphic ${compact ? "tape-graphic-compact" : ""}`} aria-label="A retro cassette tape" role="img">
      <div className="tape-label">
        <div className="label-line label-line-top" />
        <div className="label-letter">A</div>
        <div className="label-lines" />
        <div className="tape-window">
          <div className="reel reel-left" />
          <div className="window-slot" />
          <div className="reel reel-right" />
        </div>
        <div className="label-foot"><span>NR</span><span>IN</span><span>OUT</span><b>D90</b></div>
      </div>
      <div className="tape-body-line" />
      <div className="tape-brand">TDK <small>Normal Bias 120μsEQ</small> <strong>D90</strong></div>
      <div className="tape-bottom">
        <span className="tape-hole" /><span className="tape-hole tape-hole-small" /><span className="tape-hole tape-hole-small" /><span className="tape-hole" />
      </div>
    </div>
  );
}

function ProgressRail({ step }) {
  return (
    <div className="progress-rail" aria-label={`Step ${step} of 3`}>
      {[1, 2, 3].map((item, index) => (
        <div className="progress-node-wrap" key={item}>
          <div className={`progress-node ${item <= step ? "is-complete" : ""} ${item === step ? "is-current" : ""}`}>
            {item < step ? <Check size={18} strokeWidth={2.5} /> : item}
          </div>
          {index < 2 && <div className={`progress-line ${item < step ? "is-complete" : ""}`} />}
        </div>
      ))}
    </div>
  );
}

function Artwork({ song, size = "small" }) {
  const initials = `${song.title?.[0] || "M"}${song.artist?.[0] || ""}`.toUpperCase();
  return song.artwork ? (
    <img className={`artwork artwork-${size}`} src={song.artwork} alt="" loading="lazy" />
  ) : (
    <div className={`artwork artwork-${size} artwork-placeholder`} aria-hidden="true">{initials}</div>
  );
}

function Landing({ onCreate }) {
  return (
    <div className="app-shell landing-shell">
      <Header onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
      <main className="landing-reference-main">
        <section className="landing-reference-art" aria-label="A playlist collage with a retro cassette and handwritten note">
          <div className="landing-reference-stack">
            <div className="landing-reference-paper" aria-hidden="true" />
            <div className="landing-reference-cassette-css" aria-label="A retro cassette resting on the handwritten note"><TapeGraphic /></div>
          </div>
          <p className="landing-reference-note">I made this for you &lt;3.</p>
          <div className="landing-playlist-label" aria-hidden="true">
            {"PLAYLIST".split("").map((letter, index) => <span key={`${letter}-${index}`}>{letter}</span>)}
          </div>
        </section>
        <p className="landing-reference-quote">“Some songs say what words can’t.”</p>
        <button className="ink-button landing-reference-cta" onClick={onCreate}>Create a mixtape</button>
      </main>
    </div>
  );
}

function SongSearchStep({ draft, onChange, onNext }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const addFromUrl = async () => {
    if (draft.songs.length >= 8) {
      setNotice("Your tape is full — eight songs is a lovely little limit.");
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      const song = await createYouTubeSong(query);
      const duplicate = draft.songs.some((selected) => selected.source === "youtube" && selected.videoId === song.videoId);
      if (duplicate) {
        setNotice("That video is already on the tape.");
        return;
      }
      onChange({ ...draft, songs: [...draft.songs, song] });
      setQuery("");
      setNotice(`${song.title} added to the tape.`);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeSong = (id, source) => {
    onChange({ ...draft, songs: draft.songs.filter((song) => `${song.source}:${song.id}` !== `${source}:${id}`) });
    setNotice("Song removed.");
  };

  return (
    <main className="creator-main">
      <ProgressRail step={1} />
      <div className="creator-heading">
        <p className="eyebrow">step one / the soundtrack</p>
        <h1>Add your songs</h1>
        <p>Paste up to eight YouTube links that feel like the two of you.</p>
      </div>
      <div className="song-workbench">
        <div className="cassette-stage cassette-stage-search">
          <TapeGraphic />
          <div className="stage-caption">SIDE A <span>your little collection</span></div>
        </div>
        <div className="song-picker-panel">
          <div className="selected-header">
            <div><span className="section-kicker">on the tape</span><h2>{draft.songs.length === 0 ? "No songs yet" : `${draft.songs.length} ${draft.songs.length === 1 ? "song" : "songs"} added`}</h2></div>
            <span className="song-limit">{draft.songs.length} / 8</span>
          </div>
          {draft.songs.length > 0 ? (
            <div className="selected-song-list">
              {draft.songs.map((song, index) => (
                <div className="selected-song" key={`${song.source}:${song.id}`}>
                  <span className="song-index">{String(index + 1).padStart(2, "0")}</span>
                  <Artwork song={song} />
                  <div className="song-meta"><strong>{song.title}</strong><span>{song.artist}</span></div>
                  <button className="icon-button remove-button" onClick={() => removeSong(song.id, song.source)} aria-label={`Remove ${song.title}`}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          ) : <div className="empty-selection">Paste a YouTube link below,<br />then add it to your side of the tape.</div>}
          <label className="search-field youtube-url-field">
            <Youtube size={19} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addFromUrl(); }} placeholder="Paste a YouTube link" aria-label="YouTube video URL" inputMode="url" />
            {query && <button type="button" className="clear-search" onClick={() => setQuery("")} aria-label="Clear YouTube URL"><X size={15} /></button>}
          </label>
          <p className="url-help">YouTube identifies the exact recording, so there are no same-title mix-ups. Full songs play in the official YouTube player.</p>
          <div className="url-action-row"><button className="add-url-button" onClick={addFromUrl} disabled={!query.trim() || loading || draft.songs.length >= 8}>{loading ? "Reading link…" : "Add"} <Plus size={16} /></button></div>
          {notice && <p className="inline-notice" role="status">{notice}</p>}
          <div className="step-actions step-actions-single">
            <button className="ink-button" onClick={onNext} disabled={draft.songs.length === 0}>Next <ArrowRight size={18} /></button>
          </div>
        </div>
      </div>
      <p className="creator-tip"><Headphones size={15} /> Paste a YouTube watch, youtu.be, Shorts, or embed link. The video stays on YouTube.</p>
    </main>
  );
}

function NoteStep({ draft, onChange, onBack, onNext }) {
  return (
    <main className="creator-main note-step-main">
      <ProgressRail step={2} />
      <div className="creator-heading">
        <p className="eyebrow">step two / the part they keep</p>
        <h1>Leave a note</h1>
        <p>Say the thing you want the songs to say.</p>
      </div>
      <div className="note-editor-layout">
        <section className="note-paper-editor" aria-label="Note editor">
          <div className="paper-torn-edge" />
          <div className="paper-topline"><span>FROM ME TO YOU</span><span>— — — — —</span></div>
          <textarea autoFocus value={draft.note} onChange={(event) => onChange({ ...draft, note: event.target.value })} placeholder="I made this for you…" aria-label="Your note" />
        </section>
        <aside className="note-side-object">
          <TapeGraphic compact />
        </aside>
      </div>
      <div className="step-actions">
        <button className="paper-button" onClick={onBack}><ArrowLeft size={17} /> Back</button>
        <button className="ink-button" onClick={onNext} disabled={!draft.note.trim()}>Next <ArrowRight size={18} /></button>
      </div>
    </main>
  );
}

function ReviewStep({ draft, onBack, onShare }) {
  return (
    <main className="creator-main review-main">
      <ProgressRail step={3} />
      <div className="creator-heading">
        <p className="eyebrow">step three / ready to send</p>
        <h1>One last look</h1>
        <p>Everything is in place. Make a link and pass it along.</p>
      </div>
      <div className="review-layout">
        <section className="review-note-card">
          <span className="section-kicker">a note for them</span>
          <p>{draft.note}</p>
        </section>
        <section className="review-tape-card">
          <TapeGraphic compact />
          <div className="review-song-header"><span>side A</span><strong>{draft.songs.length} songs</strong></div>
          <div className="review-song-list">
            {draft.songs.map((song, index) => <div className="review-song" key={`${song.source}:${song.id}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{song.title}</strong><small>{song.artist}</small></div>)}
          </div>
        </section>
      </div>
      <div className="step-actions">
        <button className="paper-button" onClick={onBack}><ArrowLeft size={17} /> Back</button>
        <button className="ink-button share-cta" onClick={onShare}><Share2 size={17} /> Create share link</button>
      </div>
    </main>
  );
}

function CreatorFlow({ onHome, onShare }) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  return <div className="app-shell creator-shell">
    <Header onHome={onHome} />
    {step === 1 && <SongSearchStep draft={draft} onChange={setDraft} onNext={() => setStep(2)} />}
    {step === 2 && <NoteStep draft={draft} onChange={setDraft} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
    {step === 3 && <ReviewStep draft={draft} onBack={() => setStep(2)} onShare={() => onShare(draft)} />}
  </div>;
}

function InvalidPage({ onHome }) {
  return <div className="app-shell invalid-shell"><Header onHome={onHome} /><main className="invalid-main"><div className="invalid-mark"><RotateCcw size={26} /></div><p className="eyebrow">well, that tape got tangled</p><h1>This mixtape link<br /><em>isn’t readable.</em></h1><p>It may be incomplete, or the note may have been copied with a missing piece. Let’s start a fresh one.</p><button className="ink-button" onClick={onHome}>Make a new mixtape <ArrowRight size={18} /></button></main></div>;
}

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve(window.YT);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });
}

function YouTubeAudioPlayer({ song, onEnded, onPrevious, onNext }) {
  const playerHostRef = useRef(null);
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setMessage("");
    loadYouTubeApi().then((YT) => {
      if (cancelled || !playerHostRef.current) return;
      playerRef.current?.destroy?.();
      playerRef.current = new YT.Player(playerHostRef.current, {
        width: "1",
        height: "1",
        videoId: song.videoId,
        playerVars: { controls: 0, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: (event) => {
            if (!cancelled) setDuration(event.target.getDuration() || 0);
          },
          onStateChange: (event) => {
            if (cancelled) return;
            if (event.data === YT.PlayerState.PLAYING) setIsPlaying(true);
            if (event.data === YT.PlayerState.PAUSED) setIsPlaying(false);
            if (event.data === YT.PlayerState.ENDED) {
              setIsPlaying(false);
              onEnded();
            }
          },
          onError: () => {
            if (!cancelled) setMessage("This YouTube video cannot be played here. Open the source link below.");
          },
        },
      });
    });
    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [song.videoId, onEnded]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (player?.getCurrentTime) setCurrentTime(player.getCurrentTime());
    }, 500);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player?.playVideo) {
      setMessage("The player is still loading — try again in a moment.");
      return;
    }
    setMessage("");
    if (isPlaying) player.pauseVideo();
    else player.playVideo();
  };

  const seek = (event) => {
    const value = Number(event.target.value);
    setCurrentTime(value);
    playerRef.current?.seekTo?.(value, true);
  };

  return (
    <div className="youtube-audio-player" aria-label={"Audio player for " + song.title}>
      <div ref={playerHostRef} className="youtube-hidden-source" aria-hidden="true" />
      <div className="player-controls">
        <div className="progress-row"><span>{formatTime(currentTime)}</span><input aria-label="Song progress" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={seek} /><span>{formatTime(duration)}</span></div>
        <div className="control-row"><button className="control-button" onClick={onPrevious} aria-label="Previous song"><ChevronLeft size={22} /></button><button className="play-button" onClick={togglePlay} aria-label={isPlaying ? "Pause song" : "Play song"}>{isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}</button><button className="control-button" onClick={onNext} aria-label="Next song"><ChevronRight size={22} /></button></div>
      </div>
      {message && <p className="player-message" role="status">{message}</p>}
    </div>
  );
}

function PlayerView({ mixtape, onHome }) {
  const audioRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const [playerMessage, setPlayerMessage] = useState("");
  const currentSong = mixtape.songs[currentIndex];
  const isYouTubeSong = currentSong?.source === "youtube" && Boolean(currentSong?.videoId);
  const shareUrl = `${window.location.origin}/m/${mixtape.id}/${encodeShare({ ...mixtape, id: mixtape.id })}`;

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    const audio = audioRef.current;
    if (audio) audio.load();
  }, [audioRef, currentIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isYouTubeSong || !isPlaying || !currentSong?.previewUrl) return;
    audio.play().catch(() => setIsPlaying(false));
  }, [audioRef, isPlaying, currentSong?.previewUrl, isYouTubeSong]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isYouTubeSong) {
      setPlayerMessage("Use the player controls below to play the full song.");
      return;
    }
    if (!audio || !currentSong?.previewUrl) {
      setPlayerMessage("This source doesn’t provide an in-page preview. Use the source link to listen there.");
      return;
    }
    setPlayerMessage("");
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true)).catch(() => setPlayerMessage("Playback was blocked by the browser. Tap play once more to begin."));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const goTo = (index) => {
    const nextIndex = (index + mixtape.songs.length) % mixtape.songs.length;
    setCurrentIndex(nextIndex);
    setIsPlaying(Boolean(mixtape.songs[nextIndex]?.previewUrl && mixtape.songs[nextIndex]?.source !== "youtube"));
  };

  const copyLink = async () => {
    try {
      await copyText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setPlayerMessage("Copying is unavailable here — you can select the link from the address bar.");
    }
  };

  return <div className="app-shell player-shell" style={{ "--accent": mixtape.style?.accent || "#45b85c" }}>
    <Header onHome={onHome} action={<button className="header-share-button" onClick={copyLink}>{copied ? <Check size={16} /> : <LinkIcon size={16} />} {copied ? "Link copied" : "Copy link"}</button>} />
    <main className="player-main">
      <div className="player-layout">
        <section className="recipient-note-card">
          <div className="note-corner">A LITTLE NOTE</div>
          <p>{mixtape.note || "I made this for you."}</p>
        </section>
        <section className="player-object-card">
          <div className="player-object-head"><span>side A</span><span>{mixtape.songs.length} tracks / no skips</span></div>
          <TapeGraphic />
          <div className="now-playing-label"><span>now playing</span><strong>{currentSong?.title}</strong><small>{currentSong?.artist}</small></div>
          {isYouTubeSong ? (
            <YouTubeAudioPlayer song={currentSong} onEnded={() => goTo(currentIndex + 1)} onPrevious={() => goTo(currentIndex - 1)} onNext={() => goTo(currentIndex + 1)} />
          ) : (
            <div className="player-controls">
              <div className="progress-row"><span>{formatTime(currentTime)}</span><input aria-label="Song progress" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={(event) => { const value = Number(event.target.value); setCurrentTime(value); if (audioRef.current) audioRef.current.currentTime = value; }} /><span>{formatTime(duration)}</span></div>
              <div className="control-row"><button className="control-button" onClick={() => goTo(currentIndex - 1)} aria-label="Previous song"><ChevronLeft size={22} /></button><button className="play-button" onClick={togglePlay} aria-label={isPlaying ? "Pause song" : "Play song"}>{isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}</button><button className="control-button" onClick={() => goTo(currentIndex + 1)} aria-label="Next song"><ChevronRight size={22} /></button></div>
              <audio ref={audioRef} src={currentSong?.previewUrl || undefined} preload="none" onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => goTo(currentIndex + 1)} />
            </div>
          )}
          {playerMessage && <p className="player-message" role="status">{playerMessage}</p>}
        </section>
      </div>
      <section className="queue-section"><div className="queue-heading"><span className="section-kicker">the tracklist</span><span>tap a song to jump there</span></div><div className="queue-list">{mixtape.songs.map((song, index) => <button className={`queue-item ${index === currentIndex ? "is-active" : ""}`} key={`${song.source}:${song.id}`} onClick={() => { setCurrentIndex(index); setIsPlaying(Boolean(song.previewUrl && song.source !== "youtube")); }}><span className="queue-number">{String(index + 1).padStart(2, "0")}</span><Artwork song={song} /><span className="song-meta"><strong>{song.title}</strong><span>{song.artist}</span></span>{index === currentIndex ? <Volume2 className="queue-active-icon" size={17} /> : <Play className="queue-play-icon" size={15} />}</button>)}</div></section>
      <div className="player-footer"><a href={currentSong?.sourceUrl || "https://www.youtube.com/"} target="_blank" rel="noreferrer">watch on YouTube <ExternalLink size={13} /></a></div>
    </main>
  </div>;
}

export default function Home() {
  const initialShared = useMemo(() => readSharedFromLocation(), []);
  const [route, setRoute] = useState(() => initialShared ? "shared" : isMixtapePath() ? "invalid" : isCreatePath() ? "creator" : "landing");
  const [mixtape, setMixtape] = useState(initialShared);

  useEffect(() => {
    const onPopState = () => {
      const nextShared = readSharedFromLocation();
      setMixtape(nextShared);
      setRoute(nextShared ? "shared" : isMixtapePath() ? "invalid" : isCreatePath() ? "creator" : "landing");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const goHome = () => {
    window.history.pushState({}, "", "/");
    setMixtape(null);
    setRoute("landing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const create = () => {
    window.history.pushState({}, "", "/create");
    setRoute("creator");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const share = (draft) => {
    const id = createRandomId();
    const data = { id, note: draft.note, songs: draft.songs, style: { background: "#d9d6eb", accent: "#45b85c" } };
    const payload = encodeShare(data);
    window.history.pushState({}, "", `/m/${id}/${payload}`);
    setMixtape(data);
    setRoute("shared");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (route === "shared" && mixtape) return <PlayerView mixtape={mixtape} onHome={goHome} />;
  if (route === "invalid") return <InvalidPage onHome={goHome} />;
  if (route === "creator") return <CreatorFlow onHome={goHome} onShare={share} />;
  return <Landing onCreate={create} />;
}
