'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Award,
  ExternalLink,
  FolderOpen,
  Image as ImageIcon,
  Instagram,
  Facebook,
  Mail,
  Menu,
  Moon,
  Palette,
  Play,
  RefreshCw,
  Search,
  Sun,
  Video,
  X,
} from 'lucide-react';

type MediaType = 'image' | 'video';

type Artwork = {
  id: string;
  name?: string;
  title?: string;
  mimeType?: string;
  mediaType: MediaType;
  thumbnail?: string;
  url?: string;
  preview?: string;
  original?: string;
  folderId?: string;
  folderName?: string;
  createdAt?: string;
  updatedAt?: string;
  size?: number;
};

type Category = {
  key: string;
  name: string;
  type: 'all' | 'media' | 'folder';
  mediaType?: MediaType;
  folderId?: string;
  count?: number;
  images?: number;
  videos?: number;
};

type GalleryData = {
  success?: boolean;
  configured?: boolean;
  error?: string;
  updatedAt?: string;
  root?: {
    id: string;
    name: string;
  };
  totals?: {
    all: number;
    images: number;
    videos: number;
    folders: number;
  };
  categories?: Category[];
  artworks?: Artwork[];
};

const profile = {
  name: 'Akanksha Verma',
  role: 'Bachelor of Fine Arts · Painting',
  college: 'Dr. Ram Manohar Lohia Avadh University',
  achievement: 'Arts Painting of the Year · 2026',
  exhibitions: '10+',
  email: 'ssv077075@gmail.com',
  bio: 'A Fine Arts student exploring the language of colour, form and observation through painting. Her practice moves between expressive studies, portraits, sketches and experimental visual work.',
};

function titleOf(art: Artwork) {
  return art.title || art.name || 'Untitled Artwork';
}

function mediaUrl(art: Artwork) {
  return art.thumbnail || art.url || art.original || '';
}

function isVideo(art: Artwork) {
  return art.mediaType === 'video';
}

function formatDate(value?: string) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function Portfolio() {
  const [data, setData] = useState<GalleryData>({
    artworks: [],
    categories: [],
  });

  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Artwork | null>(null);
  const [query, setQuery] = useState('');
  const [dark, setDark] = useState(true);
  const [menu, setMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [showTopButton, setShowTopButton] = useState(false);

  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  /*
   * Back to top
   */
  useEffect(() => {
    const handleScroll = () => {
      setShowTopButton(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const goToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  /*
   * Load gallery
   */
  const loadGallery = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`/api/gallery?t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      });

      const json = (await response.json()) as GalleryData;

      if (!response.ok || json.success === false) {
        throw new Error(
          json.error || 'Unable to load the gallery right now.'
        );
      }

      setData({
        ...json,
        artworks: Array.isArray(json.artworks) ? json.artworks : [],
        categories: Array.isArray(json.categories)
          ? json.categories
          : [],
      });

      setLastUpdated(
        json.updatedAt || new Date().toISOString()
      );
    } catch (error) {
      console.error('Gallery load error:', error);

      setData((current) => ({
        ...current,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Gallery is temporarily unavailable.',
      }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /*
   * Initial gallery load + automatic refresh
   */
  useEffect(() => {
    void loadGallery(false);

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadGallery(true);
      }
    }, 60_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [loadGallery]);

  /*
   * Load saved theme
   */
  useEffect(() => {
    try {
      const savedTheme =
        window.localStorage.getItem('akanksha-theme');

      if (savedTheme === 'dark') {
        setDark(true);
      }

      if (savedTheme === 'light') {
        setDark(false);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  /*
   * Apply theme
   */
  useEffect(() => {
    const root = document.documentElement;

    root.dataset.theme = dark ? 'dark' : 'light';
    root.style.colorScheme = dark ? 'dark' : 'light';

    try {
      window.localStorage.setItem(
        'akanksha-theme',
        dark ? 'dark' : 'light'
      );
    } catch {
      // Ignore localStorage errors
    }
  }, [dark]);

  /*
   * Normalize artworks
   */
  const artworks = useMemo(() => {
    const list = Array.isArray(data.artworks)
      ? data.artworks
      : [];

    return list
      .filter(
        (art) =>
          art &&
          typeof art.id === 'string' &&
          art.id.length > 0 &&
          (art.mediaType === 'image' ||
            art.mediaType === 'video')
      )
      .map((art) => ({
        ...art,
        title: titleOf(art),
      }));
  }, [data.artworks]);

  /*
   * Categories
   */
  const categories = useMemo(() => {
    const fromApi = Array.isArray(data.categories)
      ? data.categories
      : [];

    const fallback: Category[] = [
      {
        key: 'all',
        name: 'All',
        type: 'all',
        count: artworks.length,
      },
      {
        key: 'images',
        name: 'Images',
        type: 'media',
        mediaType: 'image',
        count: artworks.filter(
          (art) => art.mediaType === 'image'
        ).length,
      },
      {
        key: 'videos',
        name: 'Videos',
        type: 'media',
        mediaType: 'video',
        count: artworks.filter(
          (art) => art.mediaType === 'video'
        ).length,
      },
    ];

    const map = new Map<string, Category>();

    [...fallback, ...fromApi].forEach((item) => {
      if (!item?.key) return;

      map.set(item.key, {
        ...item,
        count:
          item.count ??
          item.images ??
          item.videos ??
          0,
      });
    });

    return Array.from(map.values());
  }, [data.categories, artworks]);

  /*
   * Filter + search
   */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return artworks.filter((art) => {
      const name = titleOf(art).toLowerCase();
      const folder = (art.folderName || '').toLowerCase();
      const mime = (art.mimeType || '').toLowerCase();

      let matchesFilter = true;

      if (filter === 'images') {
        matchesFilter = art.mediaType === 'image';
      } else if (filter === 'videos') {
        matchesFilter = art.mediaType === 'video';
      } else if (filter.startsWith('folder:')) {
        matchesFilter =
          art.folderId === filter.slice(7);
      }

      const matchesSearch =
        !q ||
        name.includes(q) ||
        folder.includes(q) ||
        mime.includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [artworks, filter, query]);

  /*
   * Next / previous artwork
   */
  const step = useCallback(
    (direction: 1 | -1) => {
      setSelected((current) => {
        if (!filtered.length) return current;

        const index = current
          ? filtered.findIndex(
              (art) => art.id === current.id
            )
          : -1;

        const base = index < 0 ? 0 : index;

        return filtered[
          (base + direction + filtered.length) %
            filtered.length
        ];
      });
    },
    [filtered]
  );

  /*
   * Open artwork
   */
  const openArtwork = useCallback((art: Artwork) => {
    lastFocusedRef.current =
      document.activeElement as HTMLElement | null;

    setSelected(art);
  }, []);

  /*
   * Close artwork
   */
  const closeLightbox = useCallback(() => {
    setSelected(null);

    window.setTimeout(() => {
      lastFocusedRef.current?.focus?.();
    }, 0);
  }, []);

  /*
   * Focus close button
   */
  useEffect(() => {
    if (selected) {
      window.setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 0);
    }
  }, [selected]);

  /*
   * Keyboard controls
   */
  useEffect(() => {
    if (!selected) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        step(1);
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        step(-1);
      }
    };

    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [selected, step, closeLightbox]);

  /*
   * Prevent background scrolling
   */
  useEffect(() => {
    const locked = Boolean(selected) || menu;

    const previous = document.body.style.overflow;

    if (locked) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previous;
    };
  }, [selected, menu]);

  /*
   * Close mobile menu on resize
   */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 720) {
        setMenu(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener(
        'resize',
        handleResize
      );
    };
  }, []);

  const selectedCategoryName =
    categories.find((c) => c.key === filter)?.name ||
    'All';

  return (
    <main className="site pt-24">
      {/* ================= NAVBAR ================= */}

      <nav className="nav shell">
        <a
          className="brand"
          href="#home"
          onClick={() => setMenu(false)}
          aria-label="Akanksha Verma Home"
        >
          <span className="brand-mark">
            <Palette size={18} />
          </span>

          <span>
            AKANKSHA <i>VERMA</i>
          </span>
        </a>

        <div
          className={`nav-links ${
            menu ? 'open' : ''
          }`}
        >
          <a
            href="#home"
            onClick={() => setMenu(false)}
          >
            Home
          </a>

          <a
            href="#gallery"
            onClick={() => setMenu(false)}
          >
            Gallery
          </a>

          <a
            href="#artist"
            onClick={() => setMenu(false)}
          >
            Artist
          </a>

          <a
            href="#exhibitions"
            onClick={() => setMenu(false)}
          >
            Exhibitions
          </a>

          <a
            href="#contact"
            onClick={() => setMenu(false)}
          >
            Contact
          </a>
        </div>

        <div className="nav-actions">
          <button
            className="icon-btn"
            type="button"
            onClick={() => setDark((value) => !value)}
            aria-label={
              dark
                ? 'Switch to light theme'
                : 'Switch to dark theme'
            }
            title={
              dark
                ? 'Light mode'
                : 'Dark mode'
            }
          >
            {dark ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>

          <button
            className="menu-btn"
            type="button"
            onClick={() => setMenu((value) => !value)}
            aria-label={
              menu ? 'Close menu' : 'Open menu'
            }
            aria-expanded={menu}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* ================= HERO ================= */}

      <section
        id="home"
        className="hero shell"
      >
        <div className="hero-copy">
          <p className="eyebrow">
            FINE ARTS · PAINTING · 2026
          </p>

          <h1>
            Where <em>colour</em>
            <br />
            becomes a feeling.
          </h1>

          <p className="lead">
            A visual portfolio by{' '}
            <strong>Akanksha Verma</strong> — an
            emerging fine artist building a
            personal language through painting,
            portraiture and visual exploration.
          </p>

          <div className="hero-buttons">
            <a
              className="button primary"
              href="#gallery"
            >
              Enter the gallery
              <ArrowRight size={17} />
            </a>

            <a
              className="button ghost"
              href="#artist"
            >
              Meet the artist
            </a>
          </div>

          <div className="hero-meta">
            <span>
              <b>
                {loading ? '—' : artworks.length}
              </b>
              artworks
            </span>

            <span>
              <b>{profile.exhibitions}</b>
              exhibitions
            </span>

            <span>
              <b>
                {data.totals?.videos ??
                  artworks.filter(
                    (art) =>
                      art.mediaType === 'video'
                  ).length}
              </b>
              videos
            </span>
          </div>
        </div>

        <div className="portrait-wrap">
          <div className="portrait-frame">
            <img
              src="/akanksha-verma.png"
              alt="Portrait of Akanksha Verma"
              width={900}
              height={1200}
              loading="eager"
            />
          </div>

          <div className="portrait-tag">
            <span>01</span>

            <b>
              ARTIST
              <br />
              PORTRAIT
            </b>
          </div>

          <div className="orbit orbit-a" />
          <div className="orbit orbit-b" />
        </div>

        <a
          className="scroll"
          href="#gallery"
          aria-label="Scroll to gallery"
        >
          <ArrowDown size={16} />
          SCROLL TO EXPLORE
        </a>
      </section>

      {/* ================= GALLERY ================= */}

      <section
        id="gallery"
        className="gallery-section shell"
      >
        <div className="section-head">
          <div>
            <p className="eyebrow">
              THE COLLECTION
            </p>

            <h2>
              A living <em>gallery.</em>
            </h2>
          </div>

          <p className="section-note">
            Google Drive is the live source.
            Upload a new image or video into
            the portfolio folder and the website
            will pick it up automatically on the
            next sync.
          </p>
        </div>

        {/* Gallery controls */}

        <div className="gallery-tools">
          <div
            className="filters"
            role="tablist"
            aria-label="Gallery filters"
          >
            {categories.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={
                  filter === item.key
                }
                className={
                  filter === item.key
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setFilter(item.key)
                }
              >
                {item.type === 'media' &&
                item.mediaType === 'image' ? (
                  <ImageIcon size={14} />
                ) : null}

                {item.type === 'media' &&
                item.mediaType === 'video' ? (
                  <Video size={14} />
                ) : null}

                {item.type === 'folder' ? (
                  <FolderOpen size={14} />
                ) : null}

                {item.name}

                <small>
                  {item.count ?? 0}
                </small>
              </button>
            ))}
          </div>

          <div className="tools-right">
            <button
              className={`refresh-btn ${
                refreshing ? 'spin' : ''
              }`}
              type="button"
              onClick={() =>
                void loadGallery(true)
              }
              title="Refresh gallery"
              aria-label="Refresh gallery"
              disabled={refreshing}
            >
              <RefreshCw size={16} />
            </button>

            <label className="search">
              <Search size={16} />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search artwork..."
                aria-label="Search artworks"
                type="search"
              />
            </label>
          </div>
        </div>

        {/* Gallery status */}

        <div className="gallery-status-line">
          <span>
            Showing{' '}
            <strong>
              {filtered.length}
            </strong>{' '}
            in{' '}
            <strong>
              {selectedCategoryName}
            </strong>
          </span>

          {lastUpdated ? (
            <span>
              Live sync:{' '}
              <strong>
                {formatDate(lastUpdated)}
              </strong>
            </span>
          ) : null}
        </div>

        {/* Loading */}

        {loading ? (
          <div className="status">
            <div className="loader" />
            Opening the live gallery...
          </div>
        ) : data.error ? (
          <div className="status error">
            <strong>Gallery Error</strong>
            <span>{data.error}</span>

            <button
              type="button"
              className="retry-button"
              onClick={() =>
                void loadGallery(false)
              }
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="status">
            <ImageIcon size={30} />

            <strong>
              No media found
            </strong>

            <span>
              Try another filter or search
              term.
            </span>
          </div>
        ) : (
          <div className="masonry">
            {filtered.map((art, index) => (
              <motion.button
                type="button"
                layout
                initial={{
                  opacity: 0,
                  y: 18,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: Math.min(
                    index * 0.035,
                    0.4
                  ),
                }}
                className={`art-card ${
                  isVideo(art)
                    ? 'video-card'
                    : ''
                }`}
                key={art.id}
                onClick={() =>
                  openArtwork(art)
                }
                aria-label={`View ${titleOf(
                  art
                )}`}
              >
                <div className="media-frame">
                  {isVideo(art) ? (
                    art.preview ? (
                      <div className="video-preview">
                        <iframe
                          src={art.preview}
                          title={titleOf(art)}
                          loading="lazy"
                          allow="autoplay; fullscreen"
                          allowFullScreen
                          referrerPolicy="no-referrer"
                        />

                        <span className="video-badge">
                          <Play
                            size={12}
                            fill="currentColor"
                          />
                          VIDEO
                        </span>
                      </div>
                    ) : (
                      <div className="video-placeholder">
                        <Video size={35} />
                        <span>
                          Video preview
                          unavailable
                        </span>
                      </div>
                    )
                  ) : mediaUrl(art) ? (
                    <img
                      src={mediaUrl(art)}
                      alt={titleOf(art)}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="image-placeholder">
                      <ImageIcon size={35} />
                      <span>
                        Image unavailable
                      </span>
                    </div>
                  )}
                </div>

                <span className="art-overlay">
                  <small>
                    {art.folderName ||
                      'Portfolio'}

                    {art.updatedAt
                      ? ` · ${formatDate(
                          art.updatedAt
                        )}`
                      : ''}
                  </small>

                  <strong>
                    {titleOf(art)}
                  </strong>

                  <i>
                    {isVideo(art)
                      ? 'Watch video'
                      : 'View artwork'}

                    <ArrowRight size={14} />
                  </i>
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {/* ================= ARTIST ================= */}

      <section
        id="artist"
        className="artist-section shell"
      >
        <div className="artist-image">
          <img
            src="/akanksha-verma.png"
            alt="Akanksha Verma portrait"
            width={900}
            height={1200}
            loading="lazy"
          />
        </div>

        <div className="artist-copy">
          <p className="eyebrow">
            THE ARTIST
          </p>

          <h2>
            Akanksha
            <br />
            <em>Verma.</em>
          </h2>

          <p className="bio">
            {profile.bio}
          </p>

          <div className="facts">
            <div>
              <span>Education</span>

              <b>
                Bachelor of Fine Arts
              </b>

              <small>
                {profile.college}
              </small>
            </div>

            <div>
              <span>Practice</span>

              <b>
                Painting &amp; Visual Arts
              </b>

              <small>
                Portrait · Sketch · Colour ·
                Mixed Media
              </small>
            </div>
          </div>

          <a
            className="text-link"
            href={`mailto:${profile.email}`}
          >
            Start a conversation
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* ================= EXHIBITIONS ================= */}

      <section
        id="exhibitions"
        className="exhibitions shell"
      >
        <div>
          <p className="eyebrow">
            MILESTONES
          </p>

          <h2>
            On the <em>wall.</em>
          </h2>
        </div>

        <div className="milestone">
          <Award size={30} />

          <div>
            <span>2026</span>

            <h3>
              {profile.achievement}
            </h3>

            <p>
              Recognition celebrating her
              work and creative practice in
              fine arts.
            </p>
          </div>
        </div>

        <div className="milestone">
          <Palette size={30} />

          <div>
            <span>EXHIBITIONS</span>

            <h3>
              {profile.exhibitions} &amp;
              counting
            </h3>

            <p>
              A growing body of exhibition
              experience across academic and
              art spaces.
            </p>
          </div>
        </div>
      </section>

      {/* ================= CONTACT ================= */}

      <section
        id="contact"
        className="contact shell"
      >
        <div>
          <p className="eyebrow">
            CONTACT
          </p>

          <h2>
            Let&apos;s talk
            <br />
            <em>about art.</em>
          </h2>
        </div>

        <div className="contact-right">
          <p>
            For portfolio enquiries,
            collaborations, exhibitions or
            academic art projects.
          </p>

          <a
            className="mail"
            href={`mailto:${profile.email}`}
          >
            <Mail size={18} />

            {profile.email}

            <ExternalLink size={15} />
          </a>

          <div className="social-note">
            <Instagram size={18} />

            <span>
              Instagram profile can be added
              when the artist&apos;s handle is
              confirmed.
            </span>
            <Facebook size={18} />

            <span>
              Facebook profile can be added
              when the artist&apos;s handle is
              confirmed.
            </span>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}

      <footer className="footer shell">
        <span>
          © {new Date().getFullYear()}{' '}
          Akanksha Verma
        </span>

        <span>
          Fine Arts Portfolio · Built as a digital gallery || Designed & developed by{' '}
          <a
            href="https://akash-shakti.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Akash Verma
          </a>
        </span>
      </footer>

      {/* ================= LIGHTBOX ================= */}

      <AnimatePresence>
        {selected ? (
          <motion.div
            className="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
            aria-label={titleOf(selected)}
          >
            <button
              type="button"
              ref={closeBtnRef}
              className="close"
              onClick={closeLightbox}
              aria-label="Close artwork viewer"
            >
              <X />
            </button>

            {filtered.length > 1 ? (
              <button
                type="button"
                className="lb-nav left"
                aria-label="Previous artwork"
                onClick={(event) => {
                  event.stopPropagation();
                  step(-1);
                }}
              >
                <ArrowLeft />
              </button>
            ) : null}

            <motion.div
              className="viewer"
              initial={{
                scale: 0.94,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="viewer-media">
                {isVideo(selected) ? (
                  selected.preview ? (
                    <iframe
                      src={selected.preview}
                      title={titleOf(
                        selected
                      )}
                      allow="autoplay; fullscreen"
                      allowFullScreen
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="viewer-empty">
                      <Video size={45} />
                      <span>
                        Video preview
                        unavailable
                      </span>
                    </div>
                  )
                ) : mediaUrl(selected) ? (
                  <img
                    src={mediaUrl(selected)}
                    alt={titleOf(selected)}
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="viewer-empty">
                    <ImageIcon size={45} />
                    <span>
                      Image unavailable
                    </span>
                  </div>
                )}
              </div>

              <div className="viewer-info">
                <div>
                  <small>
                    {isVideo(selected)
                      ? 'VIDEO'
                      : 'IMAGE'}

                    {' · '}

                    {selected.folderName ||
                      'Portfolio'}
                  </small>

                  <h3>
                    {titleOf(selected)}
                  </h3>

                  {selected.updatedAt ? (
                    <p>
                      Updated{' '}
                      {formatDate(
                        selected.updatedAt
                      )}
                    </p>
                  ) : null}
                </div>

                {selected.original ? (
                  <a
                    href={selected.original}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in Drive
                    <ExternalLink size={14} />
                  </a>
                ) : null}
              </div>
            </motion.div>

            {filtered.length > 1 ? (
              <button
                type="button"
                className="lb-nav right"
                aria-label="Next artwork"
                onClick={(event) => {
                  event.stopPropagation();
                  step(1);
                }}
              >
                <ArrowRight />
              </button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ================= BACK TO TOP ================= */}

      <AnimatePresence>
        {showTopButton ? (
          <motion.button
            initial={{
              opacity: 0,
              scale: 0.8,
              y: 10,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              y: 10,
            }}
            type="button"
            onClick={goToTop}
            aria-label="Back to top"
            className="top-button"
          >
            <ArrowDown size={18} />
          </motion.button>
        ) : null}
      </AnimatePresence>

      {/* ================= GLOBAL CSS ================= */}

      <style jsx global>{`
        :root {
          --bg: #0a0a09;
          --surface: #11110f;
          --surface-2: #171714;
          --text: #f2eee6;
          --muted: #aaa59b;
          --line: rgba(255, 255, 255, 0.1);
          --accent: #d58f6d;
          --accent-2: #e9c9ad;
          --shadow: rgba(0, 0, 0, 0.35);
        }

        :root[data-theme='light'] {
          --bg: #f4f1ea;
          --surface: #fffdf8;
          --surface-2: #eee9df;
          --text: #171612;
          --muted: #666158;
          --line: rgba(20, 18, 13, 0.12);
          --accent: #a94f31;
          --accent-2: #7e3927;
          --shadow: rgba(30, 25, 15, 0.15);
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
          scroll-padding-top: 90px;
        }

        body {
          margin: 0;
          background:
            radial-gradient(
              circle at 80% 10%,
              rgba(213, 143, 109, 0.08),
              transparent 30rem
            ),
            var(--bg);
          color: var(--text);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          transition:
            background 0.3s ease,
            color 0.3s ease;
        }

        button,
        input {
          font: inherit;
        }

        button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        ::selection {
          background: var(--accent);
          color: white;
        }

        .site {
          min-height: 100vh;
          overflow: hidden;
        }

        .shell {
          width: min(
            1200px,
            calc(100% - 48px)
          );
          margin-inline: auto;
        }

        /* NAV */

        .nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1000;

  background: rgba(10, 10, 10, 0.82);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);

  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.nav-inner {
  width: min(1180px, calc(100% - 32px));
  min-height: 78px;
  margin: 0 auto;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          letter-spacing: 0.08em;
          font-size: 13px;
          font-weight: 800;
        }

        .brand i {
          color: var(--accent);
          font-style: normal;
        }

        .brand-mark {
          width: 35px;
          height: 35px;
          border: 1px solid var(--line);
          display: grid;
          place-items: center;
          border-radius: 50%;
        }

        .nav-links {
          display: flex;
          gap: 30px;
          font-size: 13px;
          color: var(--muted);
        }

        .nav-links a {
          transition:
            color 0.2s ease,
            transform 0.2s ease;
        }

        .nav-links a:hover {
          color: var(--text);
          transform: translateY(-1px);
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .icon-btn,
        .menu-btn,
        .refresh-btn {
          border: 1px solid var(--line);
          background: transparent;
          color: var(--text);
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .icon-btn:hover,
        .menu-btn:hover,
        .refresh-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }

        .menu-btn {
          display: none;
          width: 40px;
          height: 40px;
          border-radius: 10px;
        }

        /* HERO */

        .hero {
          min-height: 720px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 50px;
          align-items: center;
          position: relative;
          padding-block: 90px 110px;
        }

        .eyebrow {
          margin: 0 0 20px;
          font-size: 11px;
          letter-spacing: 0.25em;
          color: var(--muted);
          font-weight: 800;
        }

        h1,
        h2 {
          margin: 0;
          font-family:
            Georgia,
            'Times New Roman',
            serif;
          font-weight: 400;
          letter-spacing: -0.045em;
        }

        h1 {
          font-size: clamp(
            58px,
            7vw,
            100px
          );
          line-height: 0.9;
        }

        h2 {
          font-size: clamp(
            54px,
            6vw,
            84px
          );
          line-height: 0.92;
        }

        h1 em,
        h2 em {
          color: var(--accent);
          font-style: italic;
        }

        .lead {
          max-width: 620px;
          color: var(--muted);
          font-size: 16px;
          line-height: 1.75;
          margin: 30px 0;
        }

        .lead strong {
          color: var(--text);
        }

        .hero-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .button {
          min-height: 48px;
          padding: 0 19px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: 1px solid var(--line);
          transition: 0.25s ease;
        }

        .button:hover {
          transform: translateY(-2px);
        }

        .button.primary {
          background: var(--text);
          color: var(--bg);
        }

        .button.ghost:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .hero-meta {
          display: flex;
          gap: 30px;
          margin-top: 42px;
          flex-wrap: wrap;
          color: var(--muted);
          font-size: 12px;
        }

        .hero-meta b {
          display: block;
          color: var(--text);
          font-size: 22px;
          margin-bottom: 4px;
        }

        .portrait-wrap {
          position: relative;
          width: min(100%, 470px);
          justify-self: end;
        }

        .portrait-frame {
          position: relative;
          z-index: 2;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          border: 1px solid var(--line);
          background: var(--surface);
          box-shadow:
            35px 35px 0
            rgba(213, 143, 109, 0.08);
        }

        .portrait-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .portrait-tag {
          position: absolute;
          z-index: 4;
          left: -24px;
          bottom: 26px;
          background: var(--surface);
          border: 1px solid var(--line);
          padding: 13px 17px;
          display: flex;
          gap: 14px;
          align-items: center;
          font-size: 10px;
          letter-spacing: 0.16em;
        }

        .portrait-tag span {
          color: var(--accent);
        }

        .orbit {
          position: absolute;
          border: 1px solid
            rgba(213, 143, 109, 0.35);
          border-radius: 50%;
          pointer-events: none;
        }

        .orbit-a {
          inset: -35px -40px auto auto;
          width: 190px;
          height: 190px;
        }

        .orbit-b {
          inset: auto auto -45px -45px;
          width: 160px;
          height: 160px;
        }

        .scroll {
          position: absolute;
          left: 0;
          bottom: 35px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          letter-spacing: 0.18em;
          color: var(--muted);
        }

        /* GALLERY */

        .gallery-section {
          padding-block: 90px 120px;
        }

        .section-head {
          display: grid;
          grid-template-columns: 1fr 0.65fr;
          gap: 50px;
          align-items: end;
          margin-bottom: 45px;
        }

        .section-note {
          color: var(--muted);
          line-height: 1.7;
          font-size: 13px;
          max-width: 450px;
        }

        .gallery-tools {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          padding-block: 18px;
          border-block: 1px solid var(--line);
        }

        .filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filters button {
          border: 1px solid transparent;
          background: transparent;
          color: var(--muted);
          padding: 10px 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          transition: 0.2s ease;
        }

        .filters button:hover {
          color: var(--text);
          border-color: var(--line);
        }

        .filters button small {
          opacity: 0.55;
        }

        .filters button.active {
          background: var(--text);
          color: var(--bg);
        }

        .tools-right {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .refresh-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
        }

        .refresh-btn.spin svg {
          animation: spin 0.8s linear infinite;
        }

        .search {
          min-width: 220px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--line);
          padding: 8px 0;
          color: var(--muted);
        }

        .search input {
          width: 100%;
          background: transparent;
          color: var(--text);
          border: 0;
          outline: 0;
        }

        .search input::placeholder {
          color: var(--muted);
        }

        .gallery-status-line {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          color: var(--muted);
          font-size: 11px;
          padding: 15px 0 25px;
        }

        .gallery-status-line strong {
          color: var(--text);
        }

        .masonry {
          columns: 3 280px;
          column-gap: 18px;
        }

        .art-card {
          width: 100%;
          padding: 0;
          border: 0;
          background: var(--surface);
          color: var(--text);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          margin: 0 0 18px;
          break-inside: avoid;
          text-align: left;
          display: block;
        }

        .media-frame {
          width: 100%;
          min-height: 220px;
          background: var(--surface-2);
          overflow: hidden;
        }

        .media-frame img {
          display: block;
          width: 100%;
          height: auto;
          max-height: 650px;
          object-fit: cover;
          transition:
            transform 0.6s ease,
            filter 0.6s ease;
        }

        .video-preview {
          position: relative;
          aspect-ratio: 16 / 10;
          background: #050505;
        }

        .video-preview iframe {
          width: 100%;
          height: 100%;
          border: 0;
        }

        .video-placeholder,
        .image-placeholder {
          min-height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 10px;
          color: var(--muted);
          font-size: 12px;
        }

        .video-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(
            0,
            0,
            0,
            0.75
          );
          color: white;
          padding: 7px 9px;
          font-size: 10px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          letter-spacing: 0.1em;
          pointer-events: none;
        }

        .art-card:hover
          .media-frame img {
          transform: scale(1.035);
          filter: brightness(0.7);
        }

        .art-overlay {
          position: absolute;
          inset: auto 0 0;
          padding: 45px 20px 18px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          background: linear-gradient(
            transparent,
            rgba(0, 0, 0, 0.88)
          );
          color: white;
          opacity: 0;
          transform: translateY(8px);
          transition: 0.25s ease;
          pointer-events: none;
        }

        .art-card:hover
          .art-overlay,
        .art-card:focus-visible
          .art-overlay {
          opacity: 1;
          transform: translateY(0);
        }

        .art-overlay small {
          color: #ddd;
          font-size: 10px;
          letter-spacing: 0.1em;
        }

        .art-overlay strong {
          font-family:
            Georgia,
            'Times New Roman',
            serif;
          font-size: 21px;
          font-weight: 400;
        }

        .art-overlay i {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #f1b898;
          font-size: 11px;
          font-style: normal;
          margin-top: 5px;
        }

        .status {
          min-height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 15px;
          border: 1px dashed var(--line);
          color: var(--muted);
          text-align: center;
          padding: 30px;
        }

        .status.error {
          color: #d98282;
        }

        .retry-button {
          border: 1px solid var(--line);
          background: var(--surface);
          color: var(--text);
          padding: 10px 16px;
          cursor: pointer;
        }

        .retry-button:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .loader {
          width: 25px;
          height: 25px;
          border: 2px solid var(--line);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* ARTIST */

        .artist-section {
          padding-block: 100px;
          display: grid;
          grid-template-columns: 0.8fr 1.2fr;
          gap: 90px;
          align-items: center;
          border-top: 1px solid var(--line);
        }

        .artist-image {
          background: var(--surface);
          aspect-ratio: 3 / 4;
          overflow: hidden;
        }

        .artist-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .bio {
          max-width: 620px;
          color: var(--muted);
          line-height: 1.8;
          margin: 28px 0 38px;
        }

        .facts {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }

        .facts > div {
          border-top: 1px solid var(--line);
          padding-top: 15px;
        }

        .facts span,
        .facts small {
          display: block;
          color: var(--muted);
          font-size: 11px;
        }

        .facts b {
          display: block;
          margin: 8px 0;
          font-size: 14px;
        }

        .text-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--accent);
          font-size: 13px;
        }

        /* EXHIBITIONS */

        .exhibitions {
          padding-block: 100px;
          display: grid;
          grid-template-columns: 0.8fr 1fr 1fr;
          gap: 40px;
          border-top: 1px solid var(--line);
        }

        .milestone {
          display: flex;
          gap: 18px;
          border-top: 1px solid var(--line);
          padding-top: 18px;
        }

        .milestone svg {
          flex: 0 0 auto;
          color: var(--accent);
        }

        .milestone span {
          font-size: 10px;
          letter-spacing: 0.18em;
          color: var(--accent);
        }

        .milestone h3 {
          font-family:
            Georgia,
            'Times New Roman',
            serif;
          font-weight: 400;
          font-size: 24px;
          margin: 8px 0;
        }

        .milestone p,
        .contact-right p {
          color: var(--muted);
          line-height: 1.7;
          font-size: 13px;
        }

        /* CONTACT */

        .contact {
          padding-block: 110px;
          border-top: 1px solid var(--line);
          display: grid;
          grid-template-columns: 1fr 0.8fr;
          gap: 80px;
          align-items: end;
        }

        .contact-right {
          max-width: 480px;
        }

        .mail {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--line);
          padding: 13px 0;
          margin: 15px 0 25px;
          font-size: 14px;
          transition: 0.2s ease;
        }

        .mail:hover {
          color: var(--accent);
          border-color: var(--accent);
        }

        .social-note {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.6;
        }

        /* FOOTER */

        .footer {
          padding-block: 24px 35px;
          border-top: 1px solid var(--line);
          display: flex;
          justify-content: space-between;
          gap: 20px;
          color: var(--muted);
          font-size: 11px;
        }

        /* LIGHTBOX */

        .lightbox {
          position: fixed;
          z-index: 1000;
          inset: 0;
          background: rgba(
            0,
            0,
            0,
            0.93
          );
          display: grid;
          place-items: center;
          padding: 70px 70px 35px;
        }

        .close {
          position: absolute;
          top: 22px;
          right: 22px;
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border: 1px solid
            rgba(255, 255, 255, 0.2);
          background: rgba(
            0,
            0,
            0,
            0.35
          );
          color: white;
          border-radius: 50%;
          cursor: pointer;
          z-index: 3;
        }

        .close:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .viewer {
          width: min(1100px, 100%);
          max-height: calc(100vh - 100px);
          background: #111;
          border: 1px solid
            rgba(255, 255, 255, 0.12);
          overflow: hidden;
        }

        .viewer-media {
          height: min(72vh, 760px);
          background: #050505;
          display: grid;
          place-items: center;
        }

        .viewer-media img {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
        }

        .viewer-media iframe {
          width: 100%;
          height: 100%;
          border: 0;
        }

        .viewer-empty {
          color: #aaa;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 12px;
        }

        .viewer-info {
          padding: 18px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          color: white;
        }

        .viewer-info small {
          color: #aaa;
          font-size: 10px;
          letter-spacing: 0.12em;
        }

        .viewer-info h3 {
          margin: 5px 0 0;
          font-family:
            Georgia,
            'Times New Roman',
            serif;
          font-weight: 400;
          font-size: 23px;
        }

        .viewer-info p {
          margin: 4px 0 0;
          color: #aaa;
          font-size: 11px;
        }

        .viewer-info a {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #efb493;
          font-size: 12px;
          white-space: nowrap;
        }

        .lb-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid
            rgba(255, 255, 255, 0.18);
          background: rgba(
            0,
            0,
            0,
            0.45
          );
          color: white;
          display: grid;
          place-items: center;
          cursor: pointer;
          z-index: 2;
        }

        .lb-nav:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .lb-nav.left {
          left: 18px;
        }

        .lb-nav.right {
          right: 18px;
        }

        /* BACK TO TOP */

        .top-button {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 9998;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid
            rgba(255, 255, 255, 0.2);
          background: rgba(
            255,
            255,
            255,
            0.1
          );
          color: white;
          display: grid;
          place-items: center;
          cursor: pointer;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          transition: 0.3s ease;
        }

        .top-button svg {
          transform: rotate(180deg);
        }

        .top-button:hover {
          transform: translateY(-4px);
          background: var(--accent);
          border-color: var(--accent);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* TABLET */

        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
            padding-top: 65px;
          }

          .portrait-wrap {
            justify-self: center;
            width: min(85vw, 440px);
          }

          .section-head,
          .contact {
            grid-template-columns: 1fr;
            gap: 25px;
          }

          .artist-section {
            grid-template-columns: 1fr;
            gap: 45px;
          }

          .artist-image {
            width: min(80vw, 450px);
          }

          .exhibitions {
            grid-template-columns: 1fr;
          }
        }

        /* MOBILE */

        @media (max-width: 720px) {
          .shell {
            width: min(
              100% - 28px,
              1200px
            );
          }

          .nav-links {
            display: none;
            position: fixed;
            z-index: 50;
            top: 78px;
            left: 14px;
            right: 14px;
            background: var(--surface);
            border: 1px solid var(--line);
            padding: 20px;
            flex-direction: column;
            gap: 18px;
            box-shadow:
              0 20px 50px var(--shadow);
          }

          .nav-links.open {
            display: flex;
          }

          .menu-btn {
            display: grid;
          }

          .hero {
            min-height: auto;
            padding-block: 55px 100px;
          }

          h1 {
            font-size: clamp(
              52px,
              15vw,
              76px
            );
          }

          h2 {
            font-size: clamp(
              50px,
              14vw,
              70px
            );
          }

          .portrait-tag {
            left: -5px;
          }

          .gallery-tools {
            align-items: stretch;
            flex-direction: column;
          }

          .tools-right {
            width: 100%;
          }

          .search {
            flex: 1;
          }

          .gallery-status-line {
            flex-direction: column;
            gap: 7px;
          }

          .facts {
            grid-template-columns: 1fr;
          }

          .footer {
            flex-direction: column;
          }

          .lightbox {
            padding: 65px 10px 15px;
          }

          .viewer {
            max-height: calc(100vh - 85px);
          }

          .viewer-media {
            height: 62vh;
          }

          .viewer-info {
            align-items: flex-start;
            flex-direction: column;
          }

          .lb-nav {
            width: 40px;
            height: 40px;
          }

          .lb-nav.left {
            left: 7px;
          }

          .lb-nav.right {
            right: 7px;
          }

          .top-button {
            width: 44px;
            height: 44px;
            right: 16px;
            bottom: 16px;
          }
        }

        @media (max-width: 480px) {
          .hero-meta {
            gap: 20px;
          }

          .hero-buttons {
            width: 100%;
          }

          .button {
            width: 100%;
            justify-content: center;
          }

          .search {
            min-width: 0;
          }

          .portrait-wrap {
            width: 88vw;
          }

          .portrait-tag {
            font-size: 9px;
            padding: 10px 12px;
          }

          .lightbox {
            padding-inline: 5px;
          }

          .viewer-info h3 {
            font-size: 19px;
          }
        }

        /* REDUCED MOTION */

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
