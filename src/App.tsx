import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ADMIN_PASSWORD = "TTSAdmin2026!";
const DEPOSIT_PER_PLAYER = 10;
const MAX_PLAYERS = 6;

const SITE_URL = "https://teetimesocial.co.uk";

const routeMeta: Record<string, { title: string; description: string; breadcrumb: string }> = {
  "/": {
    title: "Tee Time Social | Indoor Golf, Events & Live Sport in Barnsley",
    description: "Tee Time Social is Barnsley's premium indoor golf and social venue opening Autumn 2026, with Golfzon simulators, coaching, live sport, events and memberships.",
    breadcrumb: "Home"
  },
  "/book-simulator": {
    title: "Book an Indoor Golf Simulator | Tee Time Social Barnsley",
    description: "Request a Golfzon simulator booking at Tee Time Social. Choose date, bay, duration, group size, club hire and available time slots.",
    breadcrumb: "Book Simulator"
  },
  "/pricing": {
    title: "Pricing Guide | Tee Time Social Barnsley",
    description: "View Tee Time Social pricing guidance for simulator sessions, memberships, private hire, coaching and launch packages.",
    breadcrumb: "Pricing"
  },
  "/packages": {
    title: "Packages | Tee Time Social Barnsley",
    description: "Explore Tee Time Social packages for simulator play, founding members, events, team building, junior golf and winter golf.",
    breadcrumb: "Packages"
  },
  "/events": {
    title: "Events & Private Hire | Tee Time Social Barnsley",
    description: "Plan birthdays, corporate events, golf societies, live sport nights and private hire at Tee Time Social in Barnsley.",
    breadcrumb: "Events"
  },
  "/memberships": {
    title: "Membership Waiting List | Tee Time Social",
    description: "Join the Tee Time Social membership waiting list for founding member updates, early booking access, leagues and launch offers.",
    breadcrumb: "Memberships"
  },
  "/coaching": {
    title: "Golf Coaching & GDR Max Practice | Tee Time Social",
    description: "Register interest in golf coaching, GDR Max practice sessions, junior coaching and player improvement at Tee Time Social.",
    breadcrumb: "Coaching"
  },
  "/venue": {
    title: "The Venue | Tee Time Social Barnsley",
    description: "Explore Tee Time Social's planned venue zones: Golfzon simulator bays, GDR Max studio, social space, live sport and private hire.",
    breadcrumb: "Venue"
  },
  "/guides": {
    title: "Guides | Tee Time Social Barnsley",
    description: "Read Tee Time Social guides for Golfzon, venue hire, gift vouchers, live sport, indoor golf and planning your visit.",
    breadcrumb: "Guides"
  },
  "/plan-your-visit": {
    title: "Plan Your Visit | Tee Time Social Barnsley",
    description: "Visitor information for Tee Time Social including location, group sizes, club hire, under 18s and booking guidance.",
    breadcrumb: "Plan Your Visit"
  },
  "/site-map": {
    title: "Site Map | Tee Time Social",
    description: "Find every Tee Time Social page including bookings, packages, events, guides, venue information and visitor support.",
    breadcrumb: "Site Map"
  },
  "/how-booking-works": {
    title: "How Booking Works | Tee Time Social",
    description: "A step-by-step guide to requesting a simulator booking at Tee Time Social.",
    breadcrumb: "How Booking Works"
  },
  "/simulator-guide": {
    title: "Simulator Guide | Tee Time Social",
    description: "Compare Tee Time Social simulator options including Golfzon TwoVision bays and the GDR Max studio.",
    breadcrumb: "Simulator Guide"
  },
  "/club-hire": {
    title: "Club Hire | Tee Time Social",
    description: "Learn how to bring your own clubs or request club hire for a Tee Time Social simulator booking.",
    breadcrumb: "Club Hire"
  },
};

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  name: "Tee Time Social",
  url: SITE_URL,
  description: "Barnsley's premium indoor golf and social venue opening Autumn 2026.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Regent St",
    addressLocality: "Barnsley",
    postalCode: "S70 2HJ",
    addressCountry: "GB"
  },
  email: "info@teetimesocial.co.uk"
};

function getRouteMeta(path: string) {
  return routeMeta[path] ?? {
    title: "Tee Time Social | Barnsley Indoor Golf & Social Venue",
    description: "Tee Time Social is Barnsley's upcoming indoor golf and social venue with Golfzon simulator technology, coaching, events, memberships and live sport.",
    breadcrumb: path
      .split("/")
      .filter(Boolean)
      .join(" ")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Page"
  };
}

function setMetaTag(name: string, content: string) {
  let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setPropertyTag(property: string, content: string) {
  let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setCanonical(path: string) {
  let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", `${SITE_URL}${path === "/" ? "" : path}`);
}

function updateStructuredData(path: string, meta: { title: string; description: string; breadcrumb: string }) {
  const existing = document.getElementById("tts-route-schema");
  if (existing) {
    existing.remove();
  }

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "tts-route-schema";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      pageSchema,
      {
        "@type": "WebPage",
        name: meta.title,
        description: meta.description,
        url: `${SITE_URL}${path === "/" ? "" : path}`,
        isPartOf: {
          "@type": "WebSite",
          name: "Tee Time Social",
          url: SITE_URL
        }
      }
    ]
  });
  document.head.appendChild(script);
}

function SEOManager({ path }: { path: string }) {
  useEffect(() => {
    const meta = getRouteMeta(path);
    document.title = meta.title;
    setMetaTag("description", meta.description);
    setPropertyTag("og:title", meta.title);
    setPropertyTag("og:description", meta.description);
    setPropertyTag("og:url", `${SITE_URL}${path === "/" ? "" : path}`);
    setPropertyTag("twitter:title", meta.title);
    setPropertyTag("twitter:description", meta.description);
    setCanonical(path);
    updateStructuredData(path, meta);
  }, [path]);

  return null;
}

function PageShell({ path, children }: { path: string; children: React.ReactNode }) {
  return (
    <>
      <SEOManager path={path} />
      {children}
    </>
  );
}

function Breadcrumbs({ current }: { current: string }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <div className="container breadcrumbs-inner">
        <a href="/">Home</a>
        <span>/</span>
        <strong>{current}</strong>
      </div>
    </nav>
  );
}


const interests = [
  "Simulator Bookings",
  "Memberships",
  "Lessons & Coaching",
  "Golf Leagues",
  "Events",
  "Private Hire",
  "Giveaways",
  "Professional Shop Offers"
];

const simulators = [
  "Bay 1 - Golfzon TwoVision",
  "Bay 2 - Golfzon TwoVision",
  "Bay 3 - Golfzon TwoVision",
  "Bay 4 - Golfzon TwoVision",
  "Bay 5 - Golfzon GDR Max Studio"
];

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
];

const durationOptions = [30, 60, 90];

const todayIso = new Date().toISOString().slice(0, 10);

type Lead = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  interests: string[] | null;
  message: string | null;
  source: string | null;
  created_at: string;
};

type PrivateHire = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  event_type: string | null;
  preferred_date: string | null;
  guest_count: string | null;
  message: string | null;
  created_at: string;
};

type Booking = {
  id: string;
  booking_reference: string | null;
  full_name: string;
  email: string;
  phone: string;
  booking_date: string;
  booking_time: string;
  booking_end_time: string | null;
  duration: number;
  group_size: number;
  simulator: string;
  club_hire: boolean;
  handedness: string | null;
  deposit_amount: number;
  booking_status: string | null;
  payment_status: string | null;
  notes: string | null;
  created_at: string;
};

type Membership = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  membership_type: string;
  status: string | null;
  created_at: string;
};

type BookingForm = {
  full_name: string;
  email: string;
  phone: string;
  booking_date: string;
  booking_time: string;
  duration: number;
  group_size: number;
  simulator: string;
  club_hire: boolean;
  handedness: string;
  notes: string;
};



async function notifyAdmin(subject: string, payload: Record<string, unknown>) {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        subject,
        payload
      })
    });
  } catch {
    // Email notifications should never block bookings or enquiry capture.
  }
}

function addMinutesToTime(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, mins + minutes, 0, 0);

  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function isSlotUnavailable(slot: string, duration: number, bookings: Booking[]) {
  const requestedEnd = addMinutesToTime(slot, duration);

  return bookings.some((booking) => {
    const bookingStatus = booking.booking_status ?? "pending";

    if (bookingStatus === "cancelled") {
      return false;
    }

    const existingStart = booking.booking_time;
    const existingEnd = booking.booking_end_time ?? addMinutesToTime(booking.booking_time, booking.duration);

    return slot < existingEnd && requestedEnd > existingStart;
  });
}

function LocationAndFooter() {
  return (
    <>
      <section className="section location-section">
        <div className="container location-card">
          <div>
            <p className="eyebrow">Find us</p>
            <h2>Tee Time Social, Barnsley.</h2>
            <p>
              Tee Time Social, Regent St, Barnsley S70 2HJ.
              Opening Autumn 2026.
            </p>
          </div>

          <div>
            <h3>Contact</h3>
            <p>Email: <a href="mailto:info@teetimesocial.co.uk">info@teetimesocial.co.uk</a></p>
            <p>Phone and opening times to be confirmed.</p>
          </div>
        </div>
      </section>

      <div className="sticky-cta-bar" aria-label="Quick actions">
        <a href="/book-simulator">Book simulator</a>
        <a href="/#register">Join launch list</a>
        <a href="/events">Event enquiry</a>
      </div>

      <footer className="footer footer-clean">
        <div className="container footer-clean-grid">
          <div className="footer-brand-block">
            <h3>Tee Time Social</h3>
            <p>Barnsley&apos;s premium indoor golf and social venue.</p>
            <a href="mailto:info@teetimesocial.co.uk">info@teetimesocial.co.uk</a>
          </div>

          <div className="footer-column">
            <h4>Visit</h4>
            <a href="/venue">Venue</a>
            <a href="/book-simulator">Book Simulator</a>
            <a href="/packages">Packages</a>
            <a href="/plan-your-visit">Plan Your Visit</a>
            <a href="/faq">FAQ</a>
          </div>

          <div className="footer-column">
            <h4>Events</h4>
            <a href="/events">Events</a>
            <a href="/leagues">Leagues</a>
            <a href="/venue-hire-guide">Private Hire</a>
            <a href="/corporate">Corporate</a>
            <a href="/parties">Parties</a>
          </div>

          <div className="footer-column">
            <h4>Golf</h4>
            <a href="/coaching">Coaching</a>
            <a href="/memberships">Memberships</a>
            <a href="/what-is-golfzon">Golfzon Guide</a>
            <a href="/simulator-guide">Simulator Guide</a>
            <a href="/first-time-golfers">First-Time Golfers</a>
          </div>

          <div className="footer-column">
            <h4>Company</h4>
            <a href="/contact">Contact</a>
            <a href="/accessibility">Accessibility</a>
            <a href="/house-rules">House Rules</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </div>
        </div>

        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Tee Time Social. All rights reserved.</span>
          <div>
            <a href="/cookies">Cookies</a>
            <a href="/site-map">Site Map</a>
          </div>
        </div>
      </footer>
    </>
  );
}


function App() {
  const path = window.location.pathname;

  const renderPage = () => {
    if (path === "/book-simulator") {
      return <BookSimulatorPage />;
    }

  if (path === "/memberships") {
    return <MembershipsPage />;
  }

  if (path === "/events") {
    return <EventsPage />;
  }

  if (path === "/coaching") {
    return <CoachingPage />;
  }

  if (path === "/privacy") {
    return <PrivacyPage />;
  }

  if (path === "/terms") {
    return <TermsPage />;
  }

  if (path === "/cookies") {
    return <CookiesPage />;
  }

  if (path === "/contact") {
    return <ContactPage />;
  }

  if (path === "/faq") {
    return <FAQPage />;
  }

  if (path === "/pricing") {
    return <PricingPage />;
  }

  if (path === "/leagues") {
    return <LeaguesPage />;
  }

  if (path === "/corporate") {
    return <CorporatePage />;
  }

  if (path === "/family-juniors") {
    return <FamilyJuniorsPage />;
  }

  if (path === "/venue") {
    return <VenuePage />;
  }

  if (path === "/food-drink") {
    return <FoodDrinkPage />;
  }

  if (path === "/launch") {
    return <LaunchPage />;
  }

  if (path === "/parties") {
    return <PartiesPage />;
  }

  if (path === "/golf-societies") {
    return <GolfSocietiesPage />;
  }

  if (path === "/date-night") {
    return <DateNightPage />;
  }

  if (path === "/christmas-parties") {
    return <ChristmasPartiesPage />;
  }

  if (path === "/guides") {
    return <GuidesPage />;
  }

  if (path === "/what-is-golfzon") {
    return <WhatIsGolfzonPage />;
  }

  if (path === "/gift-vouchers") {
    return <GiftVouchersPage />;
  }

  if (path === "/live-sport") {
    return <LiveSportPage />;
  }

  if (path === "/venue-hire-guide") {
    return <VenueHireGuidePage />;
  }

  if (path === "/barnsley-indoor-golf") {
    return <BarnsleyIndoorGolfPage />;
  }

  if (path === "/plan-your-visit") {
    return <PlanYourVisitPage />;
  }

  if (path === "/house-rules") {
    return <HouseRulesPage />;
  }

  if (path === "/accessibility") {
    return <AccessibilityPage />;
  }

  if (path === "/careers") {
    return <CareersPage />;
  }

  if (path === "/partnerships") {
    return <PartnershipsPage />;
  }

  if (path === "/press") {
    return <PressPage />;
  }

  if (path === "/packages") {
    return <PackagesPage />;
  }

  if (path === "/founding-members") {
    return <FoundingMembersPage />;
  }

  if (path === "/launch-offers") {
    return <LaunchOffersPage />;
  }

  if (path === "/team-building") {
    return <TeamBuildingPage />;
  }

  if (path === "/junior-golf") {
    return <JuniorGolfPage />;
  }

  if (path === "/winter-golf") {
    return <WinterGolfPage />;
  }

  if (path === "/how-booking-works") {
    return <HowBookingWorksPage />;
  }

  if (path === "/simulator-guide") {
    return <SimulatorGuidePage />;
  }

  if (path === "/club-hire") {
    return <ClubHirePage />;
  }

  if (path === "/group-bookings") {
    return <GroupBookingsPage />;
  }

  if (path === "/first-time-golfers") {
    return <FirstTimeGolfersPage />;
  }

  if (path === "/booking-faq") {
    return <BookingFAQPage />;
  }

    if (path === "/site-map") {
      return <SiteMapPage />;
    }

    if (path === "/tts-admin") {
      return <ProtectedAdminPage />;
    }

    if (path === "/") {
      return <HomePage />;
    }

    return <NotFoundPage />;
  };

  return (
    <PageShell path={path}>
      {renderPage()}
    </PageShell>
  );
}

function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const closeMenu = () => {
    setMenuOpen(false);
    setOpenGroup(null);
  };

  const toggleGroup = (group: string) => {
    setOpenGroup((current) => current === group ? null : group);
  };

  return (
    <>
      <nav className="navbar navbar-polished">
        <div className="container navbar-inner">
          <a href="/" className="brand" onClick={closeMenu}>
            <span className="brand-mark">TTS</span>
            <span>Tee Time Social</span>
          </a>

          <button
            type="button"
            className="mobile-menu-button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className={`nav-links nav-links-simplified nav-links-clean ${menuOpen ? "nav-links-open" : ""}`}>
            <a href="/" onClick={closeMenu}>Home</a>

            <div className={`nav-group ${openGroup === "about" ? "nav-group-open" : ""}`} onMouseEnter={() => setOpenGroup("about")} onMouseLeave={() => setOpenGroup(null)}>
              <button type="button" className="nav-group-button" onClick={() => toggleGroup("about")}>About</button>
              <div className="nav-dropdown">
                <a href="/venue" onClick={closeMenu}>Venue</a>
                <a href="/#simulators" onClick={closeMenu}>Simulators</a>
                <a href="/food-drink" onClick={closeMenu}>Social</a>
                <a href="/plan-your-visit" onClick={closeMenu}>Plan Your Visit</a>
                <a href="/what-is-golfzon" onClick={closeMenu}>Golfzon Guide</a>
              </div>
            </div>

            <div className={`nav-group ${openGroup === "events" ? "nav-group-open" : ""}`} onMouseEnter={() => setOpenGroup("events")} onMouseLeave={() => setOpenGroup(null)}>
              <button type="button" className="nav-group-button" onClick={() => toggleGroup("events")}>Events</button>
              <div className="nav-dropdown">
                <a href="/leagues" onClick={closeMenu}>Leagues</a>
                <a href="/venue-hire-guide" onClick={closeMenu}>Hire</a>
                <a href="/corporate" onClick={closeMenu}>Corporate</a>
                <a href="/parties" onClick={closeMenu}>Parties</a>
                <a href="/team-building" onClick={closeMenu}>Team Building</a>
              </div>
            </div>

            <div className={`nav-group ${openGroup === "more" ? "nav-group-open" : ""}`} onMouseEnter={() => setOpenGroup("more")} onMouseLeave={() => setOpenGroup(null)}>
              <button type="button" className="nav-group-button" onClick={() => toggleGroup("more")}>More</button>
              <div className="nav-dropdown nav-dropdown-wide">
                <a href="/packages" onClick={closeMenu}>Packages</a>
                <a href="/memberships" onClick={closeMenu}>Memberships</a>
                <a href="/coaching" onClick={closeMenu}>Coaching</a>
                <a href="/guides" onClick={closeMenu}>Guides</a>
                <a href="/pricing" onClick={closeMenu}>Pricing</a>
                <a href="/faq" onClick={closeMenu}>FAQ</a>
              </div>
            </div>

            <a href="/book-simulator" className="nav-book-button nav-book-button-glow" onClick={closeMenu}><span>Book</span></a>
          </div>
        </div>
      </nav>
    </>
  );
}

function HomePage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [leadStatus, setLeadStatus] = useState("");

  const [hireForm, setHireForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    event_type: "",
    preferred_date: "",
    guest_count: "",
    message: ""
  });

  const [hireStatus, setHireStatus] = useState("");
  const selectedCount = useMemo(() => selectedInterests.length, [selectedInterests]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest]
    );
  };

  const submitLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLeadStatus("Submitting...");

    const { error } = await supabase.from("leads").insert({
      full_name: fullName,
      email,
      phone,
      interests: selectedInterests,
      message,
      source: "coming_soon_page"
    });

    if (error) {
      setLeadStatus("Something went wrong. Please try again.");
      return;
    }

    await notifyAdmin("New website lead - Tee Time Social", {
      type: "Website lead",
      full_name: fullName,
      email,
      phone,
      interests: selectedInterests,
      message,
      source: "coming_soon_page"
    });

    setFullName("");
    setEmail("");
    setPhone("");
    setSelectedInterests([]);
    setMessage("");
    setLeadStatus("Thank you. Your interest has been registered.");
  };

  const updateHireForm = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setHireForm({ ...hireForm, [event.target.name]: event.target.value });
  };

  const submitPrivateHire = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHireStatus("Submitting...");

    const { error } = await supabase.from("private_hire_enquiries").insert({
      ...hireForm,
      source: "website_private_hire"
    });

    if (error) {
      setHireStatus("Something went wrong. Please try again.");
      return;
    }

    await notifyAdmin("New private hire enquiry - Tee Time Social", {
      type: "Private hire enquiry",
      ...hireForm,
      source: "website_private_hire"
    });

    setHireForm({
      full_name: "",
      email: "",
      phone: "",
      event_type: "",
      preferred_date: "",
      guest_count: "",
      message: ""
    });

    setHireStatus("Thank you. Your private hire enquiry has been sent.");
  };

  return (
    <main>
      <Navigation />

      <section className="hero">
        <div className="hero-glow hero-glow-one"></div>
        <div className="hero-glow hero-glow-two"></div>
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Opening Autumn 2026 in Barnsley</p>
            <h1>Yorkshire&apos;s home of indoor golf, live sport and social events.</h1>
            <p className="hero-text">
              Tee Time Social is Barnsley&apos;s premium indoor golf and social venue featuring Golfzon simulator technology, Pro Shop & Coaching, live sport, food, drink and events.
            </p>
            <div className="hero-actions">
              <a href="/book-simulator" className="button button-primary">Book Simulator</a>
              <a href="#private-hire" className="button button-secondary">Private Hire Enquiry</a>
            </div>
          </div>

          <div className="hero-card">
            <div className="status-pill"><span></span>Launch list open</div>
            <h2>Be first in line.</h2>
            <p>Get early access to simulator bookings, memberships, events, giveaways and launch offers.</p>
            <a href="#register" className="button button-light">Join the list</a>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="container stats-grid">
          <div><strong>5</strong><span>Simulator bays</span></div>
          <div><strong>4</strong><span>Golfzon TwoVision</span></div>
          <div><strong>1</strong><span>Golfzon GDR Max</span></div>
          <div><strong>2026</strong><span>Opening year</span></div>
        </div>
      </section>

      <section className="section homepage-upgrade-section">
        <div className="container upgrade-hero-grid">
          <div>
            <p className="eyebrow">Why Tee Time Social</p>
            <h2>A full venue proposition, not just simulator bays.</h2>
            <p>
              Tee Time Social combines Golfzon technology with a premium social venue:
              indoor golf, live sport, food, drink, memberships, coaching, leagues and
              private hire under one Barnsley roof.
            </p>
          </div>

          <div className="upgrade-proof-grid">
            <div><strong>5</strong><span>Total simulator spaces</span></div>
            <div><strong>6</strong><span>Players per bay</span></div>
            <div><strong>30–90</strong><span>Minute booking options</span></div>
            <div><strong>2026</strong><span>Autumn launch</span></div>
          </div>
        </div>

        <div className="container venue-pillars-grid">
          <article>
            <span>Play</span>
            <h3>Simulator golf</h3>
            <p>Casual rounds, practice sessions, competitions and group bookings using Golfzon technology.</p>
            <a href="/book-simulator">Book a bay</a>
          </article>
          <article>
            <span>Improve</span>
            <h3>Coaching & GDR Max</h3>
            <p>A dedicated practice pathway for lessons, junior coaching and data-led improvement.</p>
            <a href="/coaching">Coaching interest</a>
          </article>
          <article>
            <span>Socialise</span>
            <h3>Food, drink & live sport</h3>
            <p>A venue built for nights out, live sport, private hire and shared social experiences.</p>
            <a href="/food-drink">Explore venue</a>
          </article>
          <article>
            <span>Belong</span>
            <h3>Memberships & leagues</h3>
            <p>Waiting lists are open for founding members, regular golfers, leagues and corporate groups.</p>
            <a href="/memberships">Join waiting list</a>
          </article>
        </div>
      </section>

      <section className="section booking-journey-section">
        <div className="container booking-journey-grid">
          <div>
            <p className="eyebrow">Customer journey</p>
            <h2>Make it easy for visitors to choose what to do next.</h2>
            <p>
              The homepage now routes people into the right path: book a simulator,
              join the launch list, ask about private hire, explore memberships or
              register coaching interest.
            </p>
          </div>

          <div className="journey-steps">
            <div><strong>01</strong><span>Choose play, practice, event or membership.</span></div>
            <div><strong>02</strong><span>Submit the right form with useful enquiry details.</span></div>
            <div><strong>03</strong><span>Admin dashboard captures the lead, booking or enquiry.</span></div>
            <div><strong>04</strong><span>Customer and venue receive email confirmation.</span></div>
          </div>
        </div>
      </section>

      <section id="simulators" className="section section-dark">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Simulator technology</p>
            <h2>Premium indoor golf powered by Golfzon.</h2>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <span className="feature-number">01</span>
              <h3>4 x Golfzon TwoVision</h3>
              <p>Premium simulator bays for social golf, practice, leagues and future online bookings.</p>
            </article>

            <article className="feature-card">
              <span className="feature-number">02</span>
              <h3>1 x Golfzon GDR Max</h3>
              <p>Dedicated coaching and practice studio for lessons, swing data and player improvement.</p>
            </article>

            <article className="feature-card">
              <span className="feature-number">03</span>
              <h3>Club Hire</h3>
              <p>Players can bring their own clubs, with hire sets planned for guests who need them.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="experience" className="section section-light">
        <div className="container split">
          <div>
            <p className="eyebrow">The experience</p>
            <h2>Golf, coaching, food, drink, live sport and events.</h2>
          </div>

          <div className="experience-list">
            <div><h3>Indoor Golf</h3><p>Simulator bookings for casual play, practice, groups and leagues.</p></div>
            <div><h3>Pro Shop & Coaching</h3><p>Lessons, coaching packages, memberships and professional shop offers.</p></div>
            <div><h3>Live Sport & Social</h3><p>Food, drink, big-screen sport, social events and private hire.</p></div>
          </div>
        </div>
      </section>

      <section className="section planning-section">
        <div className="container">
          <div className="section-heading section-heading-wide">
            <p className="eyebrow">Plan your visit</p>
            <h2>Built for golfers, groups and nights out.</h2>
            <p>
              Whether guests are serious golfers, total beginners or just coming for food,
              drink and live sport, Tee Time Social is designed to feel easy to book and
              simple to enjoy.
            </p>
          </div>

          <div className="planning-grid">
            <article className="planning-card">
              <span>01</span>
              <h3>Choose your session</h3>
              <p>Pick 30, 60 or 90 minutes and bring up to six players per simulator bay.</p>
            </article>

            <article className="planning-card">
              <span>02</span>
              <h3>Bring clubs or request hire</h3>
              <p>Players can bring their own clubs or request hire sets when making a booking.</p>
            </article>

            <article className="planning-card">
              <span>03</span>
              <h3>Play, practise or socialise</h3>
              <p>Use the bays for casual games, data-led practice, coaching, leagues or group events.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section launch-section">
        <div className="container launch-grid">
          <div>
            <p className="eyebrow">Opening roadmap</p>
            <h2>What happens before launch.</h2>
            <p>
              Tee Time Social is opening in Autumn 2026. The launch list gives us a way to
              contact early supporters first as bookings, memberships, event packages and
              coaching become available.
            </p>
            <div className="hero-actions">
              <a href="#register" className="button button-primary">Join Launch List</a>
              <a href="/faq" className="button button-secondary">Read FAQs</a>
            </div>
          </div>

          <div className="timeline-card">
            <div><strong>Now</strong><span>Register interest and join the launch list</span></div>
            <div><strong>Next</strong><span>Founding memberships, event packages and coaching updates</span></div>
            <div><strong>Pre-open</strong><span>Early booking access and launch offers</span></div>
            <div><strong>Autumn 2026</strong><span>Venue opening in Barnsley</span></div>
          </div>
        </div>
      </section>

      <section className="section pricing-preview-section">
        <div className="container pricing-preview-grid">
          <div>
            <p className="eyebrow">Pricing & packages</p>
            <h2>Simple options for play, practice and groups.</h2>
            <p>
              Final pricing will be confirmed closer to opening. The current site now
              gives visitors a clear guide to the types of bookings, memberships and
              event packages Tee Time Social will offer.
            </p>
            <div className="hero-actions">
              <a href="/pricing" className="button button-primary">View Pricing Guide</a>
              <a href="/memberships" className="button button-secondary">Memberships</a>
            </div>
          </div>

          <div className="mini-price-grid">
            <div><span>Simulator Play</span><strong>30 / 60 / 90 mins</strong></div>
            <div><span>Memberships</span><strong>Waiting list open</strong></div>
            <div><span>Events</span><strong>Packages TBC</strong></div>
            <div><span>Coaching</span><strong>GDR Max studio</strong></div>
          </div>
        </div>
      </section>

      <section className="section audience-section">
        <div className="container">
          <div className="section-heading section-heading-wide">
            <p className="eyebrow">Who it is for</p>
            <h2>Different reasons to visit, one premium social venue.</h2>
            <p>
              The site now speaks directly to the main customer groups we need before launch:
              regular golfers, corporate groups, families, juniors, leagues and private hire.
            </p>
          </div>

          <div className="audience-grid">
            <a href="/leagues" className="audience-card">
              <span>Golfers</span>
              <h3>Leagues & competitions</h3>
              <p>Register interest for future indoor golf leagues, society nights and closest-to-pin competitions.</p>
            </a>

            <a href="/corporate" className="audience-card">
              <span>Businesses</span>
              <h3>Corporate events</h3>
              <p>Team socials, client entertainment, staff rewards and recurring company nights out.</p>
            </a>

            <a href="/family-juniors" className="audience-card">
              <span>Families</span>
              <h3>Juniors & family visits</h3>
              <p>Family-friendly indoor golf for accompanied juniors, beginners and school holiday activity.</p>
            </a>

            <a href="/events" className="audience-card">
              <span>Groups</span>
              <h3>Parties & private hire</h3>
              <p>Birthdays, celebrations, live sport bookings and social golf packages in Barnsley.</p>
            </a>
          </div>
        </div>
      </section>

      <section className="section occasion-finder-section">
        <div className="container occasion-finder-grid">
          <div>
            <p className="eyebrow">Occasion finder</p>
            <h2>Turn more visitors into the right type of enquiry.</h2>
            <p>
              Tee Time Social now has clearer landing pages for the most likely reasons
              people will search, share and book: birthdays, golf societies, date nights,
              Christmas parties and corporate events.
            </p>
          </div>

          <div className="occasion-link-grid">
            <a href="/parties"><span>Birthdays</span><strong>Parties & celebrations</strong></a>
            <a href="/golf-societies"><span>Golf groups</span><strong>Societies & leagues</strong></a>
            <a href="/date-night"><span>Couples</span><strong>Date nights</strong></a>
            <a href="/christmas-parties"><span>Seasonal</span><strong>Christmas parties</strong></a>
          </div>
        </div>
      </section>

      <section className="section marketing-engine-section">
        <div className="container marketing-engine-grid">
          <div>
            <p className="eyebrow">Useful guides</p>
            <h2>More reasons to find Tee Time Social before opening.</h2>
            <p>
              The site now has guide-style pages for technology, venue hire, live sport,
              gift ideas and indoor golf in Barnsley, giving visitors more useful content
              and more routes into enquiry forms.
            </p>
            <div className="hero-actions">
              <a href="/guides" className="button button-primary">Explore Guides</a>
              <a href="/#register" className="button button-secondary">Join Launch List</a>
            </div>
          </div>

          <div className="guide-teaser-grid">
            <a href="/what-is-golfzon"><span>Technology</span><strong>What is Golfzon?</strong></a>
            <a href="/venue-hire-guide"><span>Events</span><strong>Venue hire guide</strong></a>
            <a href="/gift-vouchers"><span>Gifts</span><strong>Gift voucher interest</strong></a>
            <a href="/barnsley-indoor-golf"><span>Local</span><strong>Indoor golf in Barnsley</strong></a>
          </div>
        </div>
      </section>

      <section className="section package-campaign-section">
        <div className="container package-campaign-grid">
          <div>
            <p className="eyebrow">Packages & campaigns</p>
            <h2>Clear offers for the biggest reasons people will book.</h2>
            <p>
              The website now has dedicated package and campaign routes for founding
              members, launch offers, team building, junior golf and winter golf. This
              gives the launch list more specific demand signals instead of one generic enquiry.
            </p>
            <div className="hero-actions">
              <a href="/packages" className="button button-primary">View Packages</a>
              <a href="/launch-offers" className="button button-secondary">Launch Offers</a>
            </div>
          </div>

          <div className="campaign-tile-grid">
            <a href="/founding-members"><span>Membership</span><strong>Founding members</strong></a>
            <a href="/team-building"><span>Corporate</span><strong>Team building</strong></a>
            <a href="/junior-golf"><span>Family</span><strong>Junior golf</strong></a>
            <a href="/winter-golf"><span>Seasonal</span><strong>Winter golf</strong></a>
          </div>
        </div>
      </section>

      <section className="section visitor-confidence-section">
        <div className="container visitor-confidence-grid">
          <div>
            <p className="eyebrow">Visitor confidence</p>
            <h2>Clear practical information before people visit.</h2>
            <p>
              The site now includes operational and trust pages covering visit planning,
              house rules, accessibility, careers, partnerships and press. This makes
              the website feel more complete and ready for real customers.
            </p>
            <div className="hero-actions">
              <a href="/plan-your-visit" className="button button-primary">Plan Your Visit</a>
              <a href="/house-rules" className="button button-secondary">House Rules</a>
            </div>
          </div>

          <div className="visitor-confidence-links">
            <a href="/plan-your-visit"><span>Visit</span><strong>How to plan your first visit</strong></a>
            <a href="/house-rules"><span>Rules</span><strong>Venue rules and guest expectations</strong></a>
            <a href="/accessibility"><span>Access</span><strong>Accessibility and inclusion information</strong></a>
            <a href="/careers"><span>Team</span><strong>Careers and future recruitment</strong></a>
          </div>
        </div>
      </section>

      <section className="section faq-preview-section">
        <div className="container faq-preview-grid">
          <div>
            <p className="eyebrow">Quick answers</p>
            <h2>Before you book or enquire.</h2>
          </div>

          <div className="faq-preview-list">
            <details open>
              <summary>Can non-golfers visit Tee Time Social?</summary>
              <p>Yes. The venue is designed for social groups, beginners, live sport, food, drink and events as well as golfers.</p>
            </details>
            <details>
              <summary>How many people can play in one bay?</summary>
              <p>Each simulator booking supports up to six players per bay.</p>
            </details>
            <details>
              <summary>Are under 18s allowed?</summary>
              <p>Yes, but anyone under 18 must be accompanied by an adult.</p>
            </details>
          </div>
        </div>
      </section>

      <section id="private-hire" className="section private-hire-section">
        <div className="container register-grid">
          <div>
            <p className="eyebrow">Private hire</p>
            <h2>Plan your event at Tee Time Social.</h2>
            <p>Enquire for birthdays, corporate nights, team socials, golf society events, live sport bookings and private venue hire.</p>
          </div>

          <form className="lead-form" onSubmit={submitPrivateHire}>
            <label>Full name<input name="full_name" value={hireForm.full_name} onChange={updateHireForm} required /></label>
            <label>Email address<input name="email" type="email" value={hireForm.email} onChange={updateHireForm} required /></label>
            <label>Phone number<input name="phone" value={hireForm.phone} onChange={updateHireForm} /></label>
            <label>
              Event type
              <select name="event_type" value={hireForm.event_type} onChange={updateHireForm}>
                <option value="">Select event type</option>
                <option>Birthday / Celebration</option>
                <option>Corporate Event</option>
                <option>Golf Society</option>
                <option>Live Sport Booking</option>
                <option>Bottomless Brunch</option>
                <option>Other</option>
              </select>
            </label>
            <label>Preferred date<input name="preferred_date" value={hireForm.preferred_date} onChange={updateHireForm} placeholder="TBC / preferred date" /></label>
            <label>Approx. guest count<input name="guest_count" value={hireForm.guest_count} onChange={updateHireForm} /></label>
            <label>Tell us more<textarea name="message" value={hireForm.message} onChange={updateHireForm} rows={4} /></label>
            <button className="button button-primary form-button" type="submit">Send Private Hire Enquiry</button>
            {hireStatus && <p className="form-success">{hireStatus}</p>}
          </form>
        </div>
      </section>

      <section className="section launch-pass-section">
        <div className="container launch-pass-card">
          <div>
            <p className="eyebrow">Launch pass</p>
            <h2>One form. All launch updates.</h2>
            <p>
              Visitors can now understand exactly why they should register: early booking
              access, membership releases, event package announcements, coaching updates
              and launch offers.
            </p>
          </div>
          <div className="launch-pass-benefits">
            <span>Early booking access</span>
            <span>Membership release</span>
            <span>Event packages</span>
            <span>Coaching updates</span>
            <span>Giveaways</span>
            <span>Launch offers</span>
          </div>
        </div>
      </section>

      <section id="register" className="section register-section">
        <div className="container register-grid">
          <div>
            <p className="eyebrow">Register your interest</p>
            <h2>Join the Tee Time Social launch list.</h2>
            <p>Register now for opening updates, early booking access, memberships, events and launch offers.</p>
            <div className="benefits">
              <span>Early booking access</span>
              <span>Launch offers</span>
              <span>Giveaway entries</span>
              <span>Membership updates</span>
            </div>
          </div>

          <form className="lead-form" onSubmit={submitLead}>
            <label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} required /></label>
            <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Mobile number<input value={phone} onChange={(event) => setPhone(event.target.value)} /></label>

            <div className="interest-panel">
              <p>I&apos;m interested in {selectedCount > 0 ? `(${selectedCount})` : ""}</p>
              <div className="interest-grid">
                {interests.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    className={selectedInterests.includes(interest) ? "interest-choice active" : "interest-choice"}
                    onClick={() => toggleInterest(interest)}
                    aria-pressed={selectedInterests.includes(interest)}
                  >
                    <span>{interest}</span>
                  </button>
                ))}
              </div>
            </div>

            <label>Anything else?<textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} /></label>
            <button className="button button-primary form-button" type="submit">Register Interest</button>
            {leadStatus && <p className="form-success">{leadStatus}</p>}
          </form>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}

function BookSimulatorPage() {
  const [form, setForm] = useState<BookingForm>({
    full_name: "",
    email: "",
    phone: "",
    booking_date: todayIso,
    booking_time: "",
    duration: 60,
    group_size: 2,
    simulator: simulators[0],
    club_hire: false,
    handedness: "",
    notes: ""
  });

  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState("Loading availability...");
  const [submitStatus, setSubmitStatus] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const depositAmount = form.group_size * DEPOSIT_PER_PLAYER;
  const priceBand = form.duration === 30 ? "Quick hit" : form.duration === 60 ? "Most popular" : "Best for groups";
  const recommendedFor = form.duration === 30
    ? "short practice, quick games and first-time visits"
    : form.duration === 60
      ? "casual rounds, date nights and small groups"
      : "larger groups, parties, societies and relaxed events";
  const selectedSlotEnd = form.booking_time ? addMinutesToTime(form.booking_time, form.duration) : "";

  const updateBookingForm = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    const checked = type === "checkbox" ? (event.target as HTMLInputElement).checked : undefined;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox"
        ? checked
        : name === "duration" || name === "group_size"
          ? Number(value)
          : value
    }));
  };

  const fetchAvailability = async () => {
    setAvailabilityStatus("Loading availability...");

    const { data, error } = await supabase
      .from("simulator_bookings")
      .select("id, booking_reference, full_name, email, phone, booking_date, booking_time, booking_end_time, duration, group_size, simulator, club_hire, handedness, deposit_amount, booking_status, payment_status, notes, created_at")
      .eq("booking_date", form.booking_date)
      .eq("simulator", form.simulator)
      .in("booking_status", ["pending", "confirmed"])
      .order("booking_time", { ascending: true });

    if (error) {
      setAvailabilityStatus("Unable to load availability.");
      return;
    }

    setExistingBookings((data ?? []) as Booking[]);
    setAvailabilityStatus("Availability loaded.");
  };

  useEffect(() => {
    fetchAvailability();
  }, [form.booking_date, form.simulator]);

  const availableSlots = useMemo(() => {
    return timeSlots.map((slot) => ({
      time: slot,
      unavailable: isSlotUnavailable(slot, form.duration, existingBookings)
    }));
  }, [existingBookings, form.duration]);

  const selectedSlotUnavailable = form.booking_time
    ? isSlotUnavailable(form.booking_time, form.duration, existingBookings)
    : false;

  const submitBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitStatus("Checking availability...");
    setConfirmedBooking(null);

    const { data: latestBookings, error: latestError } = await supabase
      .from("simulator_bookings")
      .select("id, booking_reference, full_name, email, phone, booking_date, booking_time, booking_end_time, duration, group_size, simulator, club_hire, handedness, deposit_amount, booking_status, payment_status, notes, created_at")
      .eq("booking_date", form.booking_date)
      .eq("simulator", form.simulator)
      .in("booking_status", ["pending", "confirmed"]);

    if (latestError) {
      setSubmitStatus("Unable to check availability. Please try again.");
      return;
    }

    if (isSlotUnavailable(form.booking_time, form.duration, (latestBookings ?? []) as Booking[])) {
      setExistingBookings((latestBookings ?? []) as Booking[]);
      setSubmitStatus("That slot has just been taken. Please choose another time.");
      return;
    }

    setSubmitStatus("Submitting booking request...");

    const bookingEndTime = addMinutesToTime(form.booking_time, form.duration);

    const { data, error } = await supabase
      .from("simulator_bookings")
      .insert({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        booking_date: form.booking_date,
        booking_time: form.booking_time,
        booking_end_time: bookingEndTime,
        duration: form.duration,
        group_size: form.group_size,
        simulator: form.simulator,
        club_hire: form.club_hire,
        handedness: form.club_hire ? form.handedness : null,
        deposit_amount: depositAmount,
        booking_status: "pending",
        payment_status: "unpaid",
        notes: form.notes
      })
      .select("id, booking_reference, full_name, email, phone, booking_date, booking_time, booking_end_time, duration, group_size, simulator, club_hire, handedness, deposit_amount, booking_status, payment_status, notes, created_at")
      .single();

    if (error) {
      setSubmitStatus("Unable to create booking. Please check the selected slot and try again.");
      return;
    }

    const savedBooking = data as Booking;
    setConfirmedBooking(savedBooking);

    await notifyAdmin("New simulator booking request - Tee Time Social", {
      type: "Simulator booking",
      booking_reference: savedBooking.booking_reference,
      full_name: savedBooking.full_name,
      email: savedBooking.email,
      phone: savedBooking.phone,
      booking_date: savedBooking.booking_date,
      booking_time: savedBooking.booking_time,
      booking_end_time: savedBooking.booking_end_time,
      duration: savedBooking.duration,
      group_size: savedBooking.group_size,
      simulator: savedBooking.simulator,
      club_hire: savedBooking.club_hire,
      handedness: savedBooking.handedness,
      deposit_amount: savedBooking.deposit_amount,
      status: savedBooking.booking_status
    });

    setSubmitStatus("Booking request received.");
    setForm((current) => ({
      ...current,
      full_name: "",
      email: "",
      phone: "",
      booking_time: "",
      club_hire: false,
      handedness: "",
      notes: ""
    }));
    fetchAvailability();
  };

  return (
    <main>
      <Navigation />
      <Breadcrumbs current="Book Simulator" />

      <section className="page-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Book simulator</p>
            <h1>Book your indoor golf simulator session.</h1>
            <p>Choose a bay, date, session length and group size. The booking journey now gives guests clearer guidance before they request a slot.</p>
          </div>

          <div className="booking-summary-card">
            <span>{priceBand}</span>
            <strong>£{depositAmount}</strong>
            <p>Estimated deposit at £{DEPOSIT_PER_PLAYER} per player. Recommended for {recommendedFor}.</p>
          </div>
        </div>
      </section>

      <section className="section booking-upgrade-section">
        <div className="container booking-upgrade-grid">
          <div>
            <p className="eyebrow">Booking guide</p>
            <h2>Pick the right session before you choose a time.</h2>
            <p>
              This page now gives visitors a clearer booking journey: session guidance,
              deposit estimate, club hire information, first-time golfer support and
              next-step expectations.
            </p>
          </div>

          <div className="session-type-grid">
            <a href="/how-booking-works"><span>Step by step</span><strong>How booking works</strong></a>
            <a href="/simulator-guide"><span>Choose bay</span><strong>Simulator guide</strong></a>
            <a href="/club-hire"><span>Need clubs?</span><strong>Club hire</strong></a>
            <a href="/group-bookings"><span>Groups</span><strong>Group bookings</strong></a>
          </div>
        </div>
      </section>

      <section className="section session-picker-section">
        <div className="container session-picker-grid">
          <article>
            <span>30 mins</span>
            <h3>Quick hit</h3>
            <p>Best for first-time visits, warm-ups, short practice and trying the simulator.</p>
          </article>
          <article className="featured-session-card">
            <span>60 mins</span>
            <h3>Most popular</h3>
            <p>Best for casual rounds, date nights, small groups and relaxed social golf.</p>
          </article>
          <article>
            <span>90 mins</span>
            <h3>Group session</h3>
            <p>Best for larger groups, parties, societies and guests who want more time.</p>
          </article>
        </div>
      </section>

      <section className="section booking-section">
        <div className="container booking-grid">
          <div className="booking-info-panel">
            <p className="eyebrow">Availability</p>
            <h2>Pick a bay and time.</h2>
            <p className="booking-help">Booked slots are disabled automatically for the selected simulator and date.</p>
            <div className="booking-side-stat">
              <span>Selected session</span>
              <strong>{form.duration} mins</strong>
              <p>{priceBand}: recommended for {recommendedFor}.</p>
            </div>
            <ul>
              <li>Maximum {MAX_PLAYERS} players per bay</li>
              <li>30, 60 or 90 minute sessions</li>
              <li>Bring your own clubs or request hire</li>
              <li>Children must be accompanied by an adult</li>
            </ul>
            <div className="booking-help-links">
              <a href="/first-time-golfers">First-time golfers</a>
              <a href="/booking-faq">Booking FAQ</a>
            </div>
          </div>

          <form className="lead-form" onSubmit={submitBooking}>
            <div className="form-row">
              <label>Full name<input name="full_name" value={form.full_name} onChange={updateBookingForm} required /></label>
              <label>Email address<input name="email" type="email" value={form.email} onChange={updateBookingForm} required /></label>
            </div>

            <label>Phone number<input name="phone" value={form.phone} onChange={updateBookingForm} required /></label>

            <div className="form-row">
              <label>Date<input name="booking_date" type="date" min={todayIso} value={form.booking_date} onChange={updateBookingForm} required /></label>
              <label>Simulator<select name="simulator" value={form.simulator} onChange={updateBookingForm}>{simulators.map((simulator) => <option key={simulator}>{simulator}</option>)}</select></label>
            </div>

            <div className="form-row">
              <label>Duration<select name="duration" value={form.duration} onChange={updateBookingForm}>{durationOptions.map((duration) => <option key={duration} value={duration}>{duration} minutes</option>)}</select></label>
              <label>Group size<select name="group_size" value={form.group_size} onChange={updateBookingForm}>{Array.from({ length: MAX_PLAYERS }, (_, index) => index + 1).map((size) => <option key={size} value={size}>{size} player{size > 1 ? "s" : ""}</option>)}</select></label>
            </div>

            <div className="booking-live-summary">
              <div><span>Duration</span><strong>{form.duration} mins</strong></div>
              <div><span>Players</span><strong>{form.group_size}</strong></div>
              <div><span>Deposit estimate</span><strong>£{depositAmount}</strong></div>
              <div><span>Time</span><strong>{form.booking_time ? `${form.booking_time} - ${selectedSlotEnd}` : "Choose slot"}</strong></div>
            </div>

            <div className="slot-panel">
              <div className="slot-panel-header">
                <strong>Available time slots</strong>
                <span>{availabilityStatus}</span>
              </div>
              <div className="slot-grid">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={slot.unavailable}
                    className={form.booking_time === slot.time ? "slot-button active" : "slot-button"}
                    onClick={() => setForm((current) => ({ ...current, booking_time: slot.time }))}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>

            <label className="checkbox-line">
              <input name="club_hire" type="checkbox" checked={form.club_hire} onChange={updateBookingForm} />
              Require golf club hire
            </label>

            {form.club_hire && (
              <label>Right or left handed clubs?<select name="handedness" value={form.handedness} onChange={updateBookingForm} required><option value="">Please select</option><option>Right handed</option><option>Left handed</option></select></label>
            )}

            <label>Notes<textarea name="notes" value={form.notes} onChange={updateBookingForm} rows={4} placeholder="Additional golfer names, accessibility requirements or anything else we should know." /></label>

            <div className="deposit-panel">
              <span>Estimated deposit</span>
              <strong>£{depositAmount}</strong>
              <p>Based on {form.group_size} player{form.group_size > 1 ? "s" : ""}. Payment will be added in a later version.</p>
            </div>

            <button className="button button-primary form-button" type="submit" disabled={!form.booking_time || selectedSlotUnavailable}>
              Request Booking
            </button>

            {selectedSlotUnavailable && <p className="form-error">The selected time is unavailable. Please choose another slot.</p>}
            {submitStatus && !confirmedBooking && <p className="form-error">{submitStatus}</p>}
            {confirmedBooking && <BookingConfirmationCard booking={confirmedBooking} />}
          </form>
        </div>
      </section>

      <section className="section booking-next-section">
        <div className="container booking-next-grid">
          <div>
            <p className="eyebrow">After you request a booking</p>
            <h2>Clear next steps for guests.</h2>
            <p>
              The current booking system saves the request, prevents double bookings and
              sends notification emails. Payment and final confirmation can be added later.
            </p>
          </div>

          <div className="booking-next-list">
            <div><strong>1. Request received</strong><span>Your selected date, time, bay and group details are saved.</span></div>
            <div><strong>2. Email notifications</strong><span>The venue and customer receive the booking request details.</span></div>
            <div><strong>3. Admin review</strong><span>The admin dashboard can update status, payment status and confirmation notes.</span></div>
            <div><strong>4. Payment later</strong><span>Stripe or another payment step can be added when you are ready.</span></div>
          </div>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}




function CoachingPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    coaching_interest: "GDR Max practice session",
    message: ""
  });

  const [status, setStatus] = useState("");

  const updateForm = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const submitCoachingLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Submitting...");

    const { error } = await supabase.from("leads").insert({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      interests: ["Lessons & Coaching", form.coaching_interest],
      message: form.message,
      source: "coaching_page"
    });

    if (error) {
      setStatus("Something went wrong. Please try again.");
      return;
    }

    await notifyAdmin("New coaching enquiry - Tee Time Social", {
      type: "Coaching enquiry",
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      coaching_interest: form.coaching_interest,
      message: form.message,
      source: "coaching_page"
    });

    setForm({
      full_name: "",
      email: "",
      phone: "",
      coaching_interest: "GDR Max practice session",
      message: ""
    });

    setStatus("Thank you. Your coaching enquiry has been registered.");
  };

  return (
    <main>
      <Navigation />
      <Breadcrumbs current="Coaching" />

      <section className="page-hero coaching-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Coaching & practice</p>
            <h1>Improve your game with indoor golf technology.</h1>
            <p>
              Tee Time Social will feature a dedicated Golfzon GDR Max studio for
              practice, lessons, coaching, data-led swing work and player development.
            </p>

            <div className="hero-actions">
              <a href="#coaching-enquiry" className="button button-primary">Register Coaching Interest</a>
              <a href="/book-simulator" className="button button-secondary">Book Simulator</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Practice studio</span>
            <strong>GDR Max</strong>
            <p>
              A dedicated coaching and practice simulator designed for swing feedback,
              improvement sessions and structured player development.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Player development</p>
            <h2>Practice with purpose.</h2>
            <p>
              Build a coaching enquiry list before launch and collect interest from
              golfers who want lessons, practice plans and performance support.
            </p>
          </div>

          <div className="coaching-card-grid">
            <article className="coaching-card">
              <span>01</span>
              <h3>GDR Max practice</h3>
              <p>Register interest for individual practice sessions using launch monitor-style feedback and structured improvement tools.</p>
            </article>

            <article className="coaching-card">
              <span>02</span>
              <h3>One-to-one lessons</h3>
              <p>Collect interest from players wanting coaching, swing changes, short-game support and guided practice.</p>
            </article>

            <article className="coaching-card">
              <span>03</span>
              <h3>Junior coaching</h3>
              <p>Build a list for junior golf sessions, school holiday activity and family-friendly development programmes.</p>
            </article>

            <article className="coaching-card">
              <span>04</span>
              <h3>Club fitting interest</h3>
              <p>Capture future pro shop and club-fitting demand before the venue opens.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section coaching-feature-section">
        <div className="container coaching-feature-grid">
          <div>
            <p className="eyebrow">Why indoor coaching?</p>
            <h2>Clear feedback, repeatable practice and year-round improvement.</h2>
            <p>
              Indoor technology helps golfers understand ball flight, strike, distance,
              consistency and swing changes without losing sessions to poor weather.
            </p>
          </div>

          <div className="coaching-feature-list">
            <div><strong>Data-led practice</strong><span>Understand distance, shot shape, strike patterns and improvement areas.</span></div>
            <div><strong>All-weather training</strong><span>Practice throughout the year in a premium indoor environment.</span></div>
            <div><strong>Coaching pathways</strong><span>Future sessions for beginners, improvers, juniors and regular players.</span></div>
            <div><strong>Pro shop pathway</strong><span>Collect demand for equipment advice, club sales and fitting enquiries.</span></div>
          </div>
        </div>
      </section>

      <section className="section coaching-pathway-section">
        <div className="container coaching-pathway-grid">
          <div>
            <p className="eyebrow">Coaching pathways</p>
            <h2>From first swing to lower scores.</h2>
            <p>
              The coaching page now explains the likely routes customers can register
              interest in before launch.
            </p>
          </div>

          <div className="coaching-pathway-steps">
            <div><strong>Beginner sessions</strong><span>Simple, welcoming indoor golf introductions.</span></div>
            <div><strong>Game improvement</strong><span>Practice plans and lessons for regular players.</span></div>
            <div><strong>Junior coaching</strong><span>Accompanied junior sessions and family-friendly activity.</span></div>
            <div><strong>Performance practice</strong><span>GDR Max feedback for distance, consistency and technique.</span></div>
          </div>
        </div>
      </section>

      <section id="coaching-enquiry" className="section register-section">
        <div className="container register-grid">
          <div>
            <p className="eyebrow">Coaching enquiry</p>
            <h2>Register your interest in coaching and practice.</h2>
            <p>
              Join the coaching list and we will contact you when lesson options,
              practice sessions and pro shop services are ready.
            </p>

            <div className="benefits">
              <span>Lessons</span>
              <span>Practice plans</span>
              <span>Junior coaching</span>
              <span>Pro shop</span>
            </div>
          </div>

          <form className="lead-form" onSubmit={submitCoachingLead}>
            <label>Full name<input name="full_name" value={form.full_name} onChange={updateForm} required /></label>
            <label>Email address<input name="email" type="email" value={form.email} onChange={updateForm} required /></label>
            <label>Phone number<input name="phone" value={form.phone} onChange={updateForm} /></label>

            <label>
              Coaching interest
              <select name="coaching_interest" value={form.coaching_interest} onChange={updateForm}>
                <option>GDR Max practice session</option>
                <option>One-to-one golf lessons</option>
                <option>Junior coaching</option>
                <option>Beginner golf sessions</option>
                <option>Club fitting / pro shop</option>
                <option>League preparation</option>
              </select>
            </label>

            <label>Message<textarea name="message" rows={5} value={form.message} onChange={updateForm} placeholder="Tell us about your current game, goals or what you want help with." /></label>

            <button className="button button-primary form-button" type="submit">Register Coaching Interest</button>
            {status && <p className={status.includes("Thank you") ? "form-success" : "form-error"}>{status}</p>}
          </form>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}


function EventsPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    event_type: "",
    preferred_date: "",
    guest_count: "",
    message: ""
  });

  const [status, setStatus] = useState("");

  const updateForm = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const submitEventEnquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Submitting...");

    const { error } = await supabase.from("private_hire_enquiries").insert({
      ...form,
      source: "events_page"
    });

    if (error) {
      setStatus("Something went wrong. Please try again.");
      return;
    }

    await notifyAdmin("New event enquiry - Tee Time Social", {
      type: "Event enquiry",
      ...form,
      source: "events_page"
    });

    setForm({
      full_name: "",
      email: "",
      phone: "",
      event_type: "",
      preferred_date: "",
      guest_count: "",
      message: ""
    });

    setStatus("Thank you. Your event enquiry has been sent.");
  };

  return (
    <main>
      <Navigation />
      <Breadcrumbs current="Events" />

      <section className="page-hero events-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Events & private hire</p>
            <h1>Golf, live sport, food, drinks and private events in Barnsley.</h1>
            <p>
              Plan birthdays, team socials, corporate events, Christmas parties,
              stag groups, junior celebrations and private simulator experiences
              at Tee Time Social.
            </p>

            <div className="hero-actions">
              <a href="#event-enquiry" className="button button-primary">Make an Enquiry</a>
              <a href="/book-simulator" className="button button-secondary">Book Simulator</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Private hire</span>
            <strong>5 Bays</strong>
            <p>
              Golfzon simulators, social space, live sport, food and drink packages
              will be available for group bookings and private events.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Event packages</p>
            <h2>Built for groups, parties and social golf.</h2>
            <p>
              Choose the type of event you are planning and tell us your preferred
              date, guest count and any special requirements.
            </p>
          </div>

          <div className="events-package-grid">
            <article className="events-package-card">
              <span>01</span>
              <h3>Birthdays & celebrations</h3>
              <p>Simulator golf, drinks, food and private space for milestone birthdays and social gatherings.</p>
            </article>

            <article className="events-package-card">
              <span>02</span>
              <h3>Corporate socials</h3>
              <p>Team building, client entertainment, staff socials and relaxed networking with indoor golf.</p>
            </article>

            <article className="events-package-card">
              <span>03</span>
              <h3>Live sport nights</h3>
              <p>Watch major sport, play simulator golf and enjoy a premium social venue atmosphere.</p>
            </article>

            <article className="events-package-card">
              <span>04</span>
              <h3>Junior & family groups</h3>
              <p>Family-friendly indoor golf experiences. Under 18s must be accompanied by an adult.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section events-feature-section">
        <div className="container events-feature-grid">
          <div>
            <p className="eyebrow">Why book Tee Time Social?</p>
            <h2>More than simulator golf.</h2>
            <p>
              Tee Time Social combines premium Golfzon technology with a social venue
              experience designed for events, competitions and memorable nights out.
            </p>
          </div>

          <div className="events-feature-list">
            <div><strong>Golfzon technology</strong><span>Four TwoVision bays and one GDR Max coaching studio.</span></div>
            <div><strong>Food & drink</strong><span>Hospitality packages will be available for groups and private hire.</span></div>
            <div><strong>Live sport</strong><span>A social venue built around golf, sport and shared experiences.</span></div>
            <div><strong>Central Barnsley</strong><span>Located on Regent Street in Barnsley town centre.</span></div>
          </div>
        </div>
      </section>

      <section className="section event-builder-section">
        <div className="container event-builder-grid">
          <div>
            <p className="eyebrow">Package builder</p>
            <h2>Tell us the type of event and we will shape the package.</h2>
            <p>
              Capture the important details now: group size, preferred date, event type
              and any requirements for golf, food, drink, live sport or private space.
            </p>
          </div>

          <div className="event-builder-list">
            <div><span>Birthdays</span><strong>Celebrations, groups and social golf</strong></div>
            <div><span>Corporate</span><strong>Team socials, clients and staff nights</strong></div>
            <div><span>Sport nights</span><strong>Live sport, drinks and simulator competitions</strong></div>
            <div><span>Societies</span><strong>Golf groups, leagues and competitions</strong></div>
          </div>
        </div>
      </section>

      <section id="event-enquiry" className="section register-section">
        <div className="container register-grid">
          <div>
            <p className="eyebrow">Event enquiry</p>
            <h2>Tell us what you are planning.</h2>
            <p>
              Send your details and we will come back to you with availability,
              package options and next steps once private hire is ready to book.
            </p>

            <div className="benefits">
              <span>Private hire</span>
              <span>Corporate events</span>
              <span>Birthdays</span>
              <span>Live sport</span>
            </div>
          </div>

          <form className="lead-form" onSubmit={submitEventEnquiry}>
            <label>Full name<input name="full_name" value={form.full_name} onChange={updateForm} required /></label>
            <label>Email address<input name="email" type="email" value={form.email} onChange={updateForm} required /></label>
            <label>Phone number<input name="phone" value={form.phone} onChange={updateForm} /></label>

            <div className="form-row">
              <label>
                Event type
                <select name="event_type" value={form.event_type} onChange={updateForm}>
                  <option value="">Select event type</option>
                  <option>Birthday / celebration</option>
                  <option>Corporate event</option>
                  <option>Private hire</option>
                  <option>Junior / family group</option>
                  <option>Christmas party</option>
                  <option>Stag / group event</option>
                  <option>Other</option>
                </select>
              </label>

              <label>Preferred date<input name="preferred_date" type="date" value={form.preferred_date} onChange={updateForm} /></label>
            </div>

            <label>Estimated guest count<input name="guest_count" value={form.guest_count} onChange={updateForm} placeholder="e.g. 12 people" /></label>
            <label>Message<textarea name="message" rows={5} value={form.message} onChange={updateForm} placeholder="Tell us about your event, preferred times and any requirements." /></label>

            <button className="button button-primary form-button" type="submit">Send Event Enquiry</button>
            {status && <p className={status.includes("Thank you") ? "form-success" : "form-error"}>{status}</p>}
          </form>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}


function MembershipsPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    membership_type: "Founding Member"
  });

  const [status, setStatus] = useState("");

  const updateMembershipForm = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const submitMembership = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Submitting...");

    const { error } = await supabase.from("memberships").insert({
      ...form,
      status: "waiting"
    });

    if (error) {
      if (error.code === "23505") {
        setStatus("This email is already on the membership waiting list.");
        return;
      }

      setStatus("Something went wrong. Please try again.");
      return;
    }

    await notifyAdmin("New membership waiting list signup - Tee Time Social", {
      type: "Membership waiting list",
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      membership_type: form.membership_type,
      status: "waiting"
    });

    setForm({
      full_name: "",
      email: "",
      phone: "",
      membership_type: "Founding Member"
    });

    setStatus("Thank you. You are now on the Tee Time Social membership waiting list.");
  };

  return (
    <main>
      <Navigation />
      <Breadcrumbs current="Memberships" />

      <section className="page-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Founding member access</p>
            <h1>Join the Tee Time Social membership waiting list.</h1>
            <p>
              Register your interest in founding member access for priority booking,
              launch offers, member events, league access and future indoor golf benefits.
            </p>

            <div className="hero-actions">
              <a href="#membership-form" className="button button-primary">Join Waiting List</a>
              <a href="/book-simulator" className="button button-secondary">Book Simulator</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Membership status</span>
            <strong>2026</strong>
            <p>
              Membership packages are being finalised. Join the waiting list now for
              early access before public release.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="container">
          <div className="membership-tier-grid">
            <article className="membership-tier-card">
              <span>01</span>
              <h3>Founding Member</h3>
              <p>Early-access list for priority launch updates, introductory offers and first access to memberships.</p>
            </article>

            <article className="membership-tier-card">
              <span>02</span>
              <h3>Golf & Practice</h3>
              <p>Future membership concept for regular simulator users, practice sessions, coaching and leagues.</p>
            </article>

            <article className="membership-tier-card">
              <span>03</span>
              <h3>Social & Events</h3>
              <p>Future membership concept for social events, live sport, private hire offers and venue experiences.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section member-benefits-section">
        <div className="container member-benefits-grid">
          <div>
            <p className="eyebrow">Member concepts</p>
            <h2>Designed for regular golfers, families and local businesses.</h2>
            <p>
              Memberships are not finalised yet, but the waiting list now separates
              demand by guest type so Tee Time Social can shape the right launch offer.
            </p>
          </div>

          <div className="member-benefits-list">
            <div><strong>Priority booking</strong><span>Potential early access to peak simulator slots.</span></div>
            <div><strong>League access</strong><span>Future indoor golf league and competition pathways.</span></div>
            <div><strong>Family & junior options</strong><span>Interest capture for accompanied juniors and family practice.</span></div>
            <div><strong>Corporate access</strong><span>Useful for staff socials, client nights and recurring group bookings.</span></div>
          </div>
        </div>
      </section>

      <section id="membership-form" className="section register-section">
        <div className="container register-grid">
          <div>
            <p className="eyebrow">Membership waiting list</p>
            <h2>Be first to hear when memberships open.</h2>
            <p>
              Add your details below and we will contact you with Tee Time Social
              membership information, launch offers and early booking access.
            </p>

            <div className="benefits">
              <span>Priority updates</span>
              <span>Launch offers</span>
              <span>Early access</span>
              <span>Member events</span>
            </div>
          </div>

          <form className="lead-form" onSubmit={submitMembership}>
            <label>Full name<input name="full_name" value={form.full_name} onChange={updateMembershipForm} required /></label>
            <label>Email address<input name="email" type="email" value={form.email} onChange={updateMembershipForm} required /></label>
            <label>Mobile number<input name="phone" value={form.phone} onChange={updateMembershipForm} /></label>

            <label>
              Membership interest
              <select name="membership_type" value={form.membership_type} onChange={updateMembershipForm}>
                <option>Founding Member</option>
                <option>Golf & Practice</option>
                <option>Family / Junior Access</option>
                <option>Corporate Membership</option>
                <option>Social & Events</option>
              </select>
            </label>

            <button className="button button-primary form-button" type="submit">Join Membership Waiting List</button>
            {status && <p className={status.includes("Thank you") ? "form-success" : "form-error"}>{status}</p>}
          </form>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}


function BookingConfirmationCard({ booking }: { booking: Booking }) {
  const bookingEnd = booking.booking_end_time ?? addMinutesToTime(booking.booking_time, booking.duration);

  return (
    <div className="booking-confirmation-card">
      <div className="booking-confirmation-header">
        <div>
          <span>Booking request received</span>
          <h3>{booking.booking_reference ?? "Booking received"}</h3>
          <p>We have saved your simulator booking request. Payment and final confirmation will be added in a later version.</p>
        </div>

        <div className="qr-placeholder">
          <strong>TTS</strong>
          <span>QR ready</span>
        </div>
      </div>

      <div className="booking-confirmation-grid">
        <div>
          <span>Date</span>
          <strong>{formatDateOnly(booking.booking_date)}</strong>
        </div>
        <div>
          <span>Time</span>
          <strong>{booking.booking_time} - {bookingEnd}</strong>
        </div>
        <div>
          <span>Simulator</span>
          <strong>{booking.simulator}</strong>
        </div>
        <div>
          <span>Players</span>
          <strong>{booking.group_size}</strong>
        </div>
        <div>
          <span>Deposit estimate</span>
          <strong>£{booking.deposit_amount}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{booking.booking_status ?? "pending"}</strong>
        </div>
      </div>

      <div className="booking-next-steps">
        <h4>What happens next</h4>
        <ul>
          <li>Keep your booking reference safe.</li>
          <li>Arrive 10 minutes before your session.</li>
          <li>Bring your own clubs or request club hire on arrival.</li>
          <li>Children must be accompanied by an adult.</li>
        </ul>
      </div>

      <div className="booking-confirmation-actions">
        <a href="/book-simulator" className="button button-secondary">Make another booking</a>
        <button className="button button-primary" type="button" onClick={() => window.print()}>Print confirmation</button>
      </div>
    </div>
  );
}


function LegalPageLayout({
  eyebrow,
  title,
  intro,
  children
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main>
      <Navigation />

      <section className="page-hero legal-hero">
        <div className="container">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
      </section>

      <section className="section legal-section">
        <div className="container legal-content">
          {children}
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}

function PrivacyPage() {
  return (
    <LegalPageLayout
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="How Tee Time Social collects, uses and protects website enquiry and booking information."
    >
      <h2>Who we are</h2>
      <p>Tee Time Social is an indoor golf and social venue planned for Regent Street, Barnsley. You can contact us at <a href="mailto:info@teetimesocial.co.uk">info@teetimesocial.co.uk</a>.</p>

      <h2>Information we collect</h2>
      <p>We collect information submitted through our website forms, including names, email addresses, phone numbers, booking details, membership interests, event enquiries, coaching interests and messages.</p>

      <h2>How we use your information</h2>
      <p>We use your information to manage enquiries, process simulator booking requests, manage waiting lists, respond to private hire and coaching enquiries, provide launch updates and improve our services.</p>

      <h2>How we store your information</h2>
      <p>Website data is stored securely using our website database and email systems. Access is restricted to authorised Tee Time Social administrators.</p>

      <h2>Marketing updates</h2>
      <p>If you register interest, we may contact you with launch news, offers and relevant updates. You can ask us to remove your details at any time by emailing us.</p>

      <h2>Your rights</h2>
      <p>You can request access, correction or deletion of your personal information by contacting <a href="mailto:info@teetimesocial.co.uk">info@teetimesocial.co.uk</a>.</p>

      <h2>Last updated</h2>
      <p>June 2026.</p>
    </LegalPageLayout>
  );
}

function TermsPage() {
  return (
    <LegalPageLayout
      eyebrow="Terms"
      title="Website Terms"
      intro="The basic terms for using the Tee Time Social website and submitting enquiries."
    >
      <h2>Website use</h2>
      <p>This website is provided for information, enquiry capture and booking request purposes. By using the site, you agree not to misuse the website or submit false information.</p>

      <h2>Booking requests</h2>
      <p>Simulator bookings submitted through the website are requests until confirmed. Online payment and final booking confirmation features may be added later.</p>

      <h2>Prices and availability</h2>
      <p>Information, availability, pricing and venue details may change before opening. Tee Time Social may update website information at any time.</p>

      <h2>Under 18s</h2>
      <p>Children and young people under 18 must be accompanied by an adult while visiting Tee Time Social.</p>

      <h2>Liability</h2>
      <p>We aim to keep website information accurate, but we do not guarantee that all content is always complete, current or error-free.</p>

      <h2>Contact</h2>
      <p>For questions about these terms, email <a href="mailto:info@teetimesocial.co.uk">info@teetimesocial.co.uk</a>.</p>
    </LegalPageLayout>
  );
}

function CookiesPage() {
  return (
    <LegalPageLayout
      eyebrow="Cookies"
      title="Cookie Policy"
      intro="How Tee Time Social may use cookies and similar technologies on this website."
    >
      <h2>What cookies are</h2>
      <p>Cookies are small files that websites can place on your device to help the site work, remember choices or understand website usage.</p>

      <h2>Current cookie use</h2>
      <p>This website currently uses minimal functionality and may use essential browser storage for admin login state. Future analytics or marketing tools may introduce additional cookies.</p>

      <h2>Managing cookies</h2>
      <p>You can manage or block cookies through your browser settings. Blocking some cookies may affect website functionality.</p>

      <h2>Future updates</h2>
      <p>If analytics, advertising or third-party booking/payment tools are added, this policy should be updated to explain those cookies clearly.</p>

      <h2>Contact</h2>
      <p>Questions about cookies can be sent to <a href="mailto:info@teetimesocial.co.uk">info@teetimesocial.co.uk</a>.</p>
    </LegalPageLayout>
  );
}

function ContactPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero contact-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Contact</p>
            <h1>Contact Tee Time Social.</h1>
            <p>
              For simulator bookings, events, memberships, coaching, launch updates
              or general enquiries, contact the Tee Time Social team.
            </p>
          </div>

          <div className="booking-summary-card">
            <span>Opening</span>
            <strong>Autumn 2026</strong>
            <p>Tee Time Social, Regent Street, Barnsley S70 2HJ.</p>
          </div>
        </div>
      </section>

      <section className="section legal-section">
        <div className="container contact-grid">
          <article className="contact-card">
            <span>Email</span>
            <h2>info@teetimesocial.co.uk</h2>
            <p>Use this email for all general, booking, membership, event and coaching enquiries.</p>
            <a href="mailto:info@teetimesocial.co.uk" className="button button-primary">Email Us</a>
          </article>

          <article className="contact-card">
            <span>Venue</span>
            <h2>Regent Street, Barnsley</h2>
            <p>Tee Time Social, Regent St, Barnsley S70 2HJ. Phone number and opening hours to be confirmed.</p>
            <a href="/events" className="button button-secondary">Events Enquiry</a>
          </article>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}






function ConversionPanel({
  eyebrow,
  title,
  body,
  primaryHref = "/#register",
  primaryLabel = "Join launch list",
  secondaryHref = "/events#event-enquiry",
  secondaryLabel = "Send enquiry"
}: {
  eyebrow: string;
  title: string;
  body: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="section conversion-panel-section">
      <div className="container conversion-panel">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{body}</p>
        </div>

        <div className="conversion-panel-actions">
          <a href={primaryHref} className="button button-primary">{primaryLabel}</a>
          <a href={secondaryHref} className="button button-secondary">{secondaryLabel}</a>
        </div>
      </div>
    </section>
  );
}


function VenuePage() {
  return (
    <main>
      <Navigation />
      <Breadcrumbs current="Venue" />

      <section className="page-hero venue-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">The venue</p>
            <h1>Indoor golf, live sport and social experiences in one Barnsley venue.</h1>
            <p>
              Tee Time Social is being built as a premium indoor golf and social venue:
              Golfzon simulator technology, coaching, food, drink, events, live sport and
              memberships designed around a modern customer journey.
            </p>

            <div className="hero-actions">
              <a href="/book-simulator" className="button button-primary">Book Simulator</a>
              <a href="/#register" className="button button-secondary">Join Launch List</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Venue address</span>
            <strong>Regent Street</strong>
            <p>Tee Time Social, Regent St, Barnsley S70 2HJ. Opening Autumn 2026.</p>
          </div>
        </div>
      </section>

      <section className="section venue-map-section">
        <div className="container venue-map-grid">
          <div>
            <p className="eyebrow">Venue zones</p>
            <h2>A clearer picture of what guests can expect.</h2>
            <p>
              This page gives the website a proper venue overview before photography is ready,
              helping visitors understand the concept and reducing uncertainty.
            </p>
          </div>

          <div className="venue-zone-grid">
            <div><span>01</span><strong>Four Golfzon TwoVision bays</strong><p>Premium simulator bays for play, groups and competitions.</p></div>
            <div><span>02</span><strong>GDR Max studio</strong><p>Practice, lessons, coaching interest and performance pathways.</p></div>
            <div><span>03</span><strong>Social space</strong><p>Live sport, food, drink and group experiences.</p></div>
            <div><span>04</span><strong>Events pathway</strong><p>Private hire, corporate groups, birthdays and society nights.</p></div>
          </div>
        </div>
      </section>

      <section className="section experience-deep-section">
        <div className="container experience-deep-grid">
          <article><h3>For golfers</h3><p>Book simulator time, practise indoors, register for leagues and join the membership waiting list.</p></article>
          <article><h3>For groups</h3><p>Plan birthdays, private hire, team socials, live sport nights and corporate events.</p></article>
          <article><h3>For families</h3><p>Accompanied juniors, beginner-friendly play and future family or junior coaching updates.</p></article>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}

function FoodDrinkPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero food-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Food, drink & live sport</p>
            <h1>More reasons to stay after the round.</h1>
            <p>
              Tee Time Social is planned as a social venue as well as an indoor golf venue,
              with food, drinks, live sport and event packages forming part of the experience.
            </p>

            <div className="hero-actions">
              <a href="/events" className="button button-primary">Plan an Event</a>
              <a href="/venue" className="button button-secondary">Explore Venue</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Social venue</span>
            <strong>Golf + Sport</strong>
            <p>Hospitality packages are being shaped for launch and private hire enquiries are open.</p>
          </div>
        </div>
      </section>

      <section className="section social-menu-section">
        <div className="container">
          <div className="section-heading section-heading-wide">
            <p className="eyebrow">Social experience</p>
            <h2>Built around golf, sport and group moments.</h2>
            <p>
              This page gives visitors and event organisers clearer reasons to enquire
              even before final menus and drinks packages are confirmed.
            </p>
          </div>

          <div className="social-menu-grid">
            <article><span>Food</span><h3>Group-friendly food</h3><p>Food packages and event-friendly options planned for private hire, parties and social golf.</p></article>
            <article><span>Drink</span><h3>Bar-led social venue</h3><p>Drinks service designed to support simulator bookings, events and live sport nights.</p></article>
            <article><span>Sport</span><h3>Live sport atmosphere</h3><p>A place to watch major sport, play simulator golf and stay longer with friends.</p></article>
            <article><span>Events</span><h3>Hospitality packages</h3><p>Private hire and group packages can be shaped around guest count and occasion.</p></article>
          </div>
        </div>
      </section>

      <section className="section conversion-band">
        <div className="container conversion-band-inner">
          <div>
            <p className="eyebrow">Planning an event?</p>
            <h2>Tell us the date, guest count and occasion.</h2>
            <p>We will use enquiries to shape event package demand ahead of launch.</p>
          </div>
          <a href="/events#event-enquiry" className="button button-primary">Send Event Enquiry</a>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}

function LaunchPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero launch-page-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Launch list</p>
            <h1>Be first to hear when Tee Time Social opens bookings.</h1>
            <p>
              The launch list is the main pre-opening conversion point for early booking access,
              founding membership updates, launch offers, event package news and coaching releases.
            </p>

            <div className="hero-actions">
              <a href="/#register" className="button button-primary">Join Launch List</a>
              <a href="/pricing" className="button button-secondary">View Pricing Guide</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Opening</span>
            <strong>Autumn 2026</strong>
            <p>Register once and choose the updates you want: bookings, memberships, coaching, events and offers.</p>
          </div>
        </div>
      </section>

      <section className="section launch-roadmap-page-section">
        <div className="container launch-roadmap-grid">
          <div>
            <p className="eyebrow">Pre-launch roadmap</p>
            <h2>What the launch list unlocks.</h2>
          </div>

          <div className="roadmap-column">
            <div><strong>Phase 1</strong><span>Collect demand for bookings, memberships, events and coaching.</span></div>
            <div><strong>Phase 2</strong><span>Release founding member and early booking updates.</span></div>
            <div><strong>Phase 3</strong><span>Announce launch offers, packages, opening details and first events.</span></div>
            <div><strong>Phase 4</strong><span>Open the venue and convert launch-list demand into bookings.</span></div>
          </div>
        </div>
      </section>

      <section className="section launch-list-deep-section">
        <div className="container launch-list-deep-grid">
          <article><span>Bookings</span><h3>Simulator access</h3><p>Be first to hear when booking slots and opening availability are released.</p></article>
          <article><span>Membership</span><h3>Founding access</h3><p>Receive updates when memberships and early member offers are ready.</p></article>
          <article><span>Events</span><h3>Packages</h3><p>Get news on private hire, corporate packages and group booking options.</p></article>
          <article><span>Coaching</span><h3>Lessons</h3><p>Hear when GDR Max practice sessions and coaching pathways open.</p></article>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}


function PricingPage() {
  return (
    <main>
      <Navigation />
      <Breadcrumbs current="Pricing" />

      <section className="page-hero pricing-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Pricing guide</p>
            <h1>Booking options, memberships and event packages.</h1>
            <p>
              Final prices will be confirmed closer to opening. This guide shows the
              planned ways guests will be able to play, practise, join and host events
              at Tee Time Social.
            </p>

            <div className="hero-actions">
              <a href="/book-simulator" className="button button-primary">Book Simulator</a>
              <a href="/events" className="button button-secondary">Event Enquiry</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Launch note</span>
            <strong>Prices TBC</strong>
            <p>Join the launch list for early booking access, introductory offers and package announcements.</p>
          </div>
        </div>
      </section>

      <section className="section pricing-page-section">
        <div className="container">
          <div className="section-heading section-heading-wide">
            <p className="eyebrow">Ways to book</p>
            <h2>Clear routes for every type of guest.</h2>
            <p>
              Tee Time Social will support casual simulator bookings, regular practice,
              coaching, memberships, private hire and larger social events.
            </p>
          </div>

          <div className="pricing-card-grid">
            <article className="pricing-card featured-pricing-card">
              <div className="pricing-card-header">
                <span>Most popular</span>
                <h3>Simulator Booking</h3>
                <strong>30 / 60 / 90 mins</strong>
              </div>
              <p>For casual golf, friends, date nights, practice sessions and small groups.</p>
              <ul>
                <li>Up to six players per bay</li>
                <li>Choice of simulator bay</li>
                <li>Club hire request option</li>
                <li>Deposit estimate currently £10 per player</li>
              </ul>
              <a href="/book-simulator" className="button button-primary">Book Simulator</a>
            </article>

            <article className="pricing-card">
              <div className="pricing-card-header">
                <span>Regular players</span>
                <h3>Memberships</h3>
                <strong>Waiting list open</strong>
              </div>
              <p>For golfers and social guests who want early access, launch offers and future member benefits.</p>
              <ul>
                <li>Founding member interest</li>
                <li>Golf & practice interest</li>
                <li>Family / junior access interest</li>
                <li>Corporate membership interest</li>
              </ul>
              <a href="/memberships" className="button button-secondary">Join Waiting List</a>
            </article>

            <article className="pricing-card">
              <div className="pricing-card-header">
                <span>Groups</span>
                <h3>Events & Private Hire</h3>
                <strong>Packages TBC</strong>
              </div>
              <p>For birthdays, corporate socials, golf societies, junior celebrations and live sport nights.</p>
              <ul>
                <li>Multi-bay event options</li>
                <li>Food and drink packages planned</li>
                <li>Live sport and social space</li>
                <li>Central Barnsley venue</li>
              </ul>
              <a href="/events" className="button button-secondary">Make Enquiry</a>
            </article>

            <article className="pricing-card">
              <div className="pricing-card-header">
                <span>Improve</span>
                <h3>Coaching & GDR Max</h3>
                <strong>Practice studio</strong>
              </div>
              <p>For lessons, practice plans, junior coaching and data-led improvement sessions.</p>
              <ul>
                <li>Golfzon GDR Max studio</li>
                <li>One-to-one lesson interest</li>
                <li>Junior coaching interest</li>
                <li>Pro shop and fitting pathway</li>
              </ul>
              <a href="/coaching" className="button button-secondary">Coaching Interest</a>
            </article>
          </div>
        </div>
      </section>

      <section className="section deposit-section">
        <div className="container deposit-grid">
          <div>
            <p className="eyebrow">Booking deposits</p>
            <h2>Built ready for payments later.</h2>
            <p>
              The booking system currently records booking requests and deposit estimates.
              Stripe/payment collection can be added later without rebuilding the whole
              customer journey.
            </p>
          </div>

          <div className="deposit-panel">
            <div><span>Deposit estimate</span><strong>£10 per player</strong></div>
            <div><span>Maximum players</span><strong>6 per bay</strong></div>
            <div><span>Current status</span><strong>Request only</strong></div>
          </div>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}



function LeaguesPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero leagues-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Leagues & competitions</p>
            <h1>Indoor golf leagues, society nights and competitive social golf.</h1>
            <p>
              Tee Time Social will be built for casual rounds, regular leagues,
              closest-to-pin nights, team formats and society-style competitions.
            </p>

            <div className="hero-actions">
              <a href="/#register" className="button button-primary">Register League Interest</a>
              <a href="/book-simulator" className="button button-secondary">Book Simulator</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>League status</span>
            <strong>Interest open</strong>
            <p>Register now so we can contact you when league formats and competition nights are released.</p>
          </div>
        </div>
      </section>

      <section className="section programme-section">
        <div className="container">
          <div className="section-heading section-heading-wide">
            <p className="eyebrow">League formats</p>
            <h2>Built for regular play and social competition.</h2>
            <p>
              The exact formats will be confirmed closer to opening, but the website now
              gives golfers a clear reason to register early.
            </p>
          </div>

          <div className="programme-grid">
            <article>
              <span>01</span>
              <h3>Weekly indoor leagues</h3>
              <p>Regular simulator league nights for individuals, pairs and small teams.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Closest-to-pin nights</h3>
              <p>Fast, social competition formats that work for golfers and non-golfers.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Society events</h3>
              <p>Indoor society meetups, winter practice nights and group competitions.</p>
            </article>
            <article>
              <span>04</span>
              <h3>Corporate leagues</h3>
              <p>Company versus company formats for local businesses and regular teams.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section conversion-band">
        <div className="container conversion-band-inner">
          <div>
            <p className="eyebrow">Get on the list</p>
            <h2>Want league updates first?</h2>
            <p>Join the launch list and select Golf Leagues so we can contact you when formats are ready.</p>
          </div>
          <a href="/#register" className="button button-primary">Join Launch List</a>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}

function CorporatePage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero corporate-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Corporate & business events</p>
            <h1>Team socials, client nights and corporate indoor golf in Barnsley.</h1>
            <p>
              Tee Time Social is designed for businesses that want something more memorable
              than a standard night out: simulator golf, live sport, food, drink and social space.
            </p>

            <div className="hero-actions">
              <a href="/events#event-enquiry" className="button button-primary">Enquire Now</a>
              <a href="/pricing" className="button button-secondary">View Packages</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Corporate use</span>
            <strong>Events & memberships</strong>
            <p>Register interest for team socials, client entertainment, company leagues and future corporate membership.</p>
          </div>
        </div>
      </section>

      <section className="section corporate-section">
        <div className="container corporate-grid">
          <div>
            <p className="eyebrow">Business use cases</p>
            <h2>A venue for work socials that do not feel like work.</h2>
            <p>
              From one-off team nights to recurring client entertainment, Tee Time Social
              can become a local destination for companies across Barnsley and Yorkshire.
            </p>
          </div>

          <div className="corporate-list">
            <div><strong>Team socials</strong><span>Reward staff, bring teams together and make work nights more interactive.</span></div>
            <div><strong>Client entertainment</strong><span>Host clients in a relaxed setting with golf, drinks and live sport.</span></div>
            <div><strong>Company leagues</strong><span>Run internal competitions or company-versus-company league nights.</span></div>
            <div><strong>Corporate membership</strong><span>Register interest for recurring business access and priority booking concepts.</span></div>
          </div>
        </div>
      </section>

      <section className="section package-strip-section">
        <div className="container package-strip-grid">
          <article><span>01</span><h3>Small team nights</h3><p>One or two bays for relaxed indoor golf and drinks.</p></article>
          <article><span>02</span><h3>Private hire</h3><p>Multi-bay use for larger teams, clients and company celebrations.</p></article>
          <article><span>03</span><h3>Recurring events</h3><p>Monthly socials, league nights and business networking ideas.</p></article>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}

function FamilyJuniorsPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero family-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Family & juniors</p>
            <h1>Family-friendly indoor golf for juniors, beginners and accompanied young players.</h1>
            <p>
              Tee Time Social will welcome families and juniors, with under 18s accompanied
              by an adult and future interest open for junior coaching and family sessions.
            </p>

            <div className="hero-actions">
              <a href="/coaching" className="button button-primary">Coaching Interest</a>
              <a href="/book-simulator" className="button button-secondary">Book Simulator</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Under 18s</span>
            <strong>Adult required</strong>
            <p>Juniors and young people are welcome when accompanied by a responsible adult.</p>
          </div>
        </div>
      </section>

      <section className="section family-section">
        <div className="container family-grid">
          <article>
            <span>01</span>
            <h3>Beginner friendly</h3>
            <p>Indoor simulator golf makes it easier for new players to try golf in a relaxed setting.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Junior coaching interest</h3>
            <p>Register for future coaching updates, junior sessions and school holiday activity.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Family groups</h3>
            <p>Book a bay for family practice, birthdays or an activity everyone can try together.</p>
          </article>
          <article>
            <span>04</span>
            <h3>Safe social venue</h3>
            <p>Under 18s must be accompanied by an adult while visiting Tee Time Social.</p>
          </article>
        </div>
      </section>

      <section className="section conversion-band">
        <div className="container conversion-band-inner">
          <div>
            <p className="eyebrow">Family updates</p>
            <h2>Want junior and family updates?</h2>
            <p>Join the launch list and select Lessons & Coaching or Memberships.</p>
          </div>
          <a href="/#register" className="button button-primary">Join Launch List</a>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}



function PartiesPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero parties-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Parties & celebrations</p>
            <h1>Birthdays, group nights and celebrations with simulator golf.</h1>
            <p>
              A more memorable way to celebrate in Barnsley: indoor golf, live sport,
              food, drink and social space designed for groups who want something different.
            </p>

            <div className="hero-actions">
              <a href="/events#event-enquiry" className="button button-primary">Plan a Party</a>
              <a href="/pricing" className="button button-secondary">View Pricing Guide</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Best for</span>
            <strong>Groups</strong>
            <p>Birthdays, celebrations, stag-style groups, friend groups and private hire enquiries.</p>
          </div>
        </div>
      </section>

      <section className="section landing-detail-section">
        <div className="container landing-detail-grid">
          <article><span>01</span><h3>Simulator play</h3><p>Book bays for relaxed games, competitions and social golf with up to six players per bay.</p></article>
          <article><span>02</span><h3>Food & drink pathway</h3><p>Hospitality packages can be shaped as menus and drinks options are confirmed closer to launch.</p></article>
          <article><span>03</span><h3>Private hire options</h3><p>For larger groups, use the event enquiry form to register your preferred date and guest count.</p></article>
        </div>
      </section>

      <ConversionPanel
        eyebrow="Party enquiry"
        title="Planning a birthday or celebration?"
        body="Send your date, guest count and occasion now so the team can shape packages before opening."
        primaryHref="/events#event-enquiry"
        primaryLabel="Send party enquiry"
        secondaryHref="/book-simulator"
        secondaryLabel="Book simulator"
      />

      <LocationAndFooter />
    </main>
  );
}

function GolfSocietiesPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero societies-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Golf societies</p>
            <h1>Indoor society nights, winter golf and group competitions.</h1>
            <p>
              Tee Time Social is being built for golf societies and groups that want
              year-round simulator golf, competitions, practice nights and social events.
            </p>

            <div className="hero-actions">
              <a href="/events#event-enquiry" className="button button-primary">Register Society Interest</a>
              <a href="/leagues" className="button button-secondary">League Interest</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Group golf</span>
            <strong>5 bays</strong>
            <p>Four TwoVision bays and one GDR Max studio create options for groups, practice and competitions.</p>
          </div>
        </div>
      </section>

      <section className="section landing-detail-section">
        <div className="container landing-detail-grid">
          <article><span>01</span><h3>Winter society nights</h3><p>Keep groups active when outdoor conditions are poor and daylight is limited.</p></article>
          <article><span>02</span><h3>Competitive formats</h3><p>Closest-to-pin, team formats, course play and society-style leaderboards can be developed.</p></article>
          <article><span>03</span><h3>Food, drink and live sport</h3><p>Build group nights around golf, hospitality and major sport fixtures.</p></article>
        </div>
      </section>

      <ConversionPanel
        eyebrow="Society enquiry"
        title="Bring your golf group indoors."
        body="Register society interest now and tell us roughly how many players you would bring."
        primaryHref="/events#event-enquiry"
        primaryLabel="Send society enquiry"
        secondaryHref="/#register"
        secondaryLabel="Join launch list"
      />

      <LocationAndFooter />
    </main>
  );
}

function DateNightPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero date-night-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Date nights</p>
            <h1>A different kind of date night in Barnsley.</h1>
            <p>
              Simulator golf makes a relaxed, fun and beginner-friendly night out:
              play a few holes, watch live sport, have food and drinks, and do something
              more interactive than a standard bar booking.
            </p>

            <div className="hero-actions">
              <a href="/book-simulator" className="button button-primary">Book Simulator</a>
              <a href="/food-drink" className="button button-secondary">Food & Drink</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Beginner friendly</span>
            <strong>No experience needed</strong>
            <p>Perfect for golfers and non-golfers. Bring clubs or request club hire when booking.</p>
          </div>
        </div>
      </section>

      <section className="section landing-detail-section">
        <div className="container landing-detail-grid">
          <article><span>01</span><h3>Easy to try</h3><p>Simulator golf is accessible for beginners, casual players and people trying golf for the first time.</p></article>
          <article><span>02</span><h3>Social setting</h3><p>Food, drink and live sport give guests reasons to stay before or after their session.</p></article>
          <article><span>03</span><h3>Flexible session lengths</h3><p>Choose 30, 60 or 90 minutes depending on the type of night you are planning.</p></article>
        </div>
      </section>

      <ConversionPanel
        eyebrow="Plan your visit"
        title="Try something different."
        body="Book a simulator session or join the launch list for early access and opening offers."
        primaryHref="/book-simulator"
        primaryLabel="Book simulator"
        secondaryHref="/#register"
        secondaryLabel="Join launch list"
      />

      <LocationAndFooter />
    </main>
  );
}

function ChristmasPartiesPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero christmas-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Christmas parties</p>
            <h1>Christmas party enquiries for teams, groups and businesses.</h1>
            <p>
              Tee Time Social gives Barnsley groups a more interactive Christmas party idea:
              simulator golf, live sport, food, drinks and event packages shaped around guest count.
            </p>

            <div className="hero-actions">
              <a href="/events#event-enquiry" className="button button-primary">Send Christmas Enquiry</a>
              <a href="/corporate" className="button button-secondary">Corporate Events</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Seasonal events</span>
            <strong>Packages TBC</strong>
            <p>Register enquiries early so package demand can be shaped before launch.</p>
          </div>
        </div>
      </section>

      <section className="section landing-detail-section">
        <div className="container landing-detail-grid">
          <article><span>01</span><h3>Team nights</h3><p>A social alternative for staff parties, team rewards and end-of-year celebrations.</p></article>
          <article><span>02</span><h3>Group packages</h3><p>Use the enquiry form to share guest numbers, date preferences and food or drink requirements.</p></article>
          <article><span>03</span><h3>Live sport atmosphere</h3><p>Combine simulator golf with sport, drinks and a premium venue feel.</p></article>
        </div>
      </section>

      <ConversionPanel
        eyebrow="Christmas enquiry"
        title="Start planning early."
        body="Tell us your group size and preferred dates so Tee Time Social can shape seasonal packages."
        primaryHref="/events#event-enquiry"
        primaryLabel="Send Christmas enquiry"
        secondaryHref="/corporate"
        secondaryLabel="Corporate options"
      />

      <LocationAndFooter />
    </main>
  );
}



function GuideCTA({
  eyebrow,
  title,
  body,
  primaryHref = "/#register",
  primaryLabel = "Join launch list",
  secondaryHref = "/contact",
  secondaryLabel = "Contact us"
}: {
  eyebrow: string;
  title: string;
  body: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="section guide-cta-section">
      <div className="container guide-cta-card">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{body}</p>
        </div>

        <div className="guide-cta-actions">
          <a href={primaryHref} className="button button-primary">{primaryLabel}</a>
          <a href={secondaryHref} className="button button-secondary">{secondaryLabel}</a>
        </div>
      </div>
    </section>
  );
}

function GuidesPage() {
  return (
    <main>
      <Navigation />
      <Breadcrumbs current="Guides" />

      <section className="page-hero guides-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Guides</p>
            <h1>Plan your visit, event or launch-list sign-up.</h1>
            <p>
              Useful guides for indoor golf, Golfzon technology, venue hire, live sport,
              gift ideas and planning a visit to Tee Time Social in Barnsley.
            </p>

            <div className="hero-actions">
              <a href="/#register" className="button button-primary">Join Launch List</a>
              <a href="/book-simulator" className="button button-secondary">Book Simulator</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Content hub</span>
            <strong>Plan ahead</strong>
            <p>Use these pages to choose the right enquiry path before Tee Time Social opens.</p>
          </div>
        </div>
      </section>

      <section className="section guide-hub-section">
        <div className="container guide-hub-grid">
          <a href="/what-is-golfzon" className="guide-card">
            <span>Technology</span>
            <h3>What is Golfzon?</h3>
            <p>Explain the simulator technology and why it creates a premium indoor golf experience.</p>
          </a>
          <a href="/venue-hire-guide" className="guide-card">
            <span>Private hire</span>
            <h3>Venue hire guide</h3>
            <p>Help groups understand what to include in an enquiry and how packages can be shaped.</p>
          </a>
          <a href="/live-sport" className="guide-card">
            <span>Social</span>
            <h3>Live sport at Tee Time Social</h3>
            <p>Position the venue as more than golf: a place to watch sport, eat, drink and stay longer.</p>
          </a>
          <a href="/gift-vouchers" className="guide-card">
            <span>Gifts</span>
            <h3>Gift voucher interest</h3>
            <p>Capture future demand for simulator, coaching and experience-based gift vouchers.</p>
          </a>
          <a href="/barnsley-indoor-golf" className="guide-card">
            <span>Local</span>
            <h3>Indoor golf in Barnsley</h3>
            <p>A local landing page for people searching for indoor golf, golf simulators and social golf.</p>
          </a>
          <a href="/faq" className="guide-card">
            <span>Questions</span>
            <h3>FAQs</h3>
            <p>Quick answers about opening, location, under 18s, club hire, memberships and bookings.</p>
          </a>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}

function WhatIsGolfzonPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero golfzon-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Golfzon technology</p>
            <h1>What is Golfzon and why does it matter?</h1>
            <p>
              Tee Time Social is planned around Golfzon simulator technology, including
              four TwoVision bays and one GDR Max studio for practice, coaching and improvement.
            </p>

            <div className="hero-actions">
              <a href="/book-simulator" className="button button-primary">Book Simulator</a>
              <a href="/coaching" className="button button-secondary">Coaching Interest</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Venue tech</span>
            <strong>TwoVision + GDR Max</strong>
            <p>Premium simulator play plus a dedicated coaching and practice pathway.</p>
          </div>
        </div>
      </section>

      <section className="section guide-article-section">
        <div className="container guide-article-grid">
          <aside className="guide-aside">
            <p className="eyebrow">In this guide</p>
            <a href="#twovision">TwoVision bays</a>
            <a href="#gdr">GDR Max studio</a>
            <a href="#who">Who it helps</a>
          </aside>

          <article className="guide-article">
            <section id="twovision">
              <h2>Golfzon TwoVision bays</h2>
              <p>TwoVision bays are planned for simulator bookings, social golf, practice, leagues, private hire and group experiences. They give guests a premium indoor golf experience that is suitable for serious golfers, casual players and beginners.</p>
            </section>

            <section id="gdr">
              <h2>GDR Max studio</h2>
              <p>The GDR Max studio is planned as a more coaching-led space for practice, lessons, swing work and player development. This helps separate casual play from improvement sessions.</p>
            </section>

            <section id="who">
              <h2>Who benefits?</h2>
              <p>Golfzon technology helps golfers practise year-round, lets groups enjoy golf without needing perfect weather, and gives non-golfers a more accessible way to try the game in a social venue.</p>
            </section>
          </article>
        </div>
      </section>

      <GuideCTA
        eyebrow="Try it first"
        title="Want early simulator access?"
        body="Join the launch list or submit a booking request to be part of the first wave of Tee Time Social visitors."
        primaryHref="/#register"
        primaryLabel="Join launch list"
        secondaryHref="/book-simulator"
        secondaryLabel="Book simulator"
      />

      <LocationAndFooter />
    </main>
  );
}

function GiftVouchersPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero vouchers-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Gift ideas</p>
            <h1>Gift voucher interest for indoor golf experiences.</h1>
            <p>
              Tee Time Social gift vouchers are a future opportunity for birthdays,
              Christmas, Father&apos;s Day, corporate rewards and experience gifts.
            </p>

            <div className="hero-actions">
              <a href="/#register" className="button button-primary">Register Gift Interest</a>
              <a href="/date-night" className="button button-secondary">Date Night Ideas</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Future product</span>
            <strong>Vouchers TBC</strong>
            <p>Register interest now so demand can be measured before gift vouchers are released.</p>
          </div>
        </div>
      </section>

      <section className="section voucher-section">
        <div className="container voucher-grid">
          <article><span>01</span><h3>Simulator experience</h3><p>Gift simulator time for golfers, beginners, families or groups.</p></article>
          <article><span>02</span><h3>Coaching gift</h3><p>Future coaching or GDR Max practice vouchers could suit golfers wanting to improve.</p></article>
          <article><span>03</span><h3>Social night out</h3><p>Experience gifts can combine golf, food, drink and live sport.</p></article>
          <article><span>04</span><h3>Corporate rewards</h3><p>Businesses can register interest for staff rewards and client gifting ideas.</p></article>
        </div>
      </section>

      <GuideCTA
        eyebrow="Gift interest"
        title="Want to hear when vouchers launch?"
        body="Join the launch list and tell us you are interested in gifts, vouchers or experience packages."
        primaryHref="/#register"
        primaryLabel="Join launch list"
        secondaryHref="/contact"
        secondaryLabel="Ask a question"
      />

      <LocationAndFooter />
    </main>
  );
}

function LiveSportPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero live-sport-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Live sport</p>
            <h1>Watch sport, play simulator golf and make a night of it.</h1>
            <p>
              Tee Time Social is planned as a social venue where live sport, simulator golf,
              food and drink work together for longer visits and better group nights.
            </p>

            <div className="hero-actions">
              <a href="/events" className="button button-primary">Plan Sport Night</a>
              <a href="/food-drink" className="button button-secondary">Food & Drink</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Venue use</span>
            <strong>Golf + sport</strong>
            <p>Good for major fixtures, group bookings, casual drinks and private hire enquiries.</p>
          </div>
        </div>
      </section>

      <section className="section live-sport-section">
        <div className="container live-sport-grid">
          <article><span>Football</span><h3>Big-match atmosphere</h3><p>Plan group bookings around major football fixtures and live sport nights.</p></article>
          <article><span>Golf</span><h3>Golf events</h3><p>Simulator golf and live golf viewing can work together for majors and society nights.</p></article>
          <article><span>Groups</span><h3>Stay longer</h3><p>Food, drink and sport give visitors a reason to stay beyond their simulator session.</p></article>
        </div>
      </section>

      <GuideCTA
        eyebrow="Sport enquiry"
        title="Planning a live sport group booking?"
        body="Tell us the fixture, guest count and date so future packages can be shaped around demand."
        primaryHref="/events#event-enquiry"
        primaryLabel="Send event enquiry"
        secondaryHref="/book-simulator"
        secondaryLabel="Book simulator"
      />

      <LocationAndFooter />
    </main>
  );
}

function VenueHireGuidePage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero hire-guide-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Venue hire guide</p>
            <h1>How to plan a private hire enquiry.</h1>
            <p>
              A simple guide for birthdays, corporate events, Christmas parties,
              golf societies and group nights out at Tee Time Social.
            </p>

            <div className="hero-actions">
              <a href="/events#event-enquiry" className="button button-primary">Send Hire Enquiry</a>
              <a href="/parties" className="button button-secondary">Party Ideas</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Useful details</span>
            <strong>Date + guest count</strong>
            <p>The more detail you send, the easier it is to shape package options later.</p>
          </div>
        </div>
      </section>

      <section className="section guide-checklist-section">
        <div className="container guide-checklist-grid">
          <div>
            <p className="eyebrow">Checklist</p>
            <h2>What to include in your enquiry.</h2>
            <p>Use this checklist before submitting a private hire or event enquiry.</p>
          </div>

          <div className="checklist-card">
            <div><strong>Event type</strong><span>Birthday, corporate, society, live sport, Christmas or private hire.</span></div>
            <div><strong>Preferred date</strong><span>Add a date or note whether it is flexible.</span></div>
            <div><strong>Guest count</strong><span>Estimate numbers so the team can understand scale.</span></div>
            <div><strong>Food and drink</strong><span>Tell us if you want hospitality, drinks or packages.</span></div>
            <div><strong>Simulator use</strong><span>Say whether guests want to play, practise or compete.</span></div>
          </div>
        </div>
      </section>

      <GuideCTA
        eyebrow="Ready to enquire?"
        title="Send the event details now."
        body="Private hire enquiries are open so Tee Time Social can build demand before launch."
        primaryHref="/events#event-enquiry"
        primaryLabel="Send hire enquiry"
        secondaryHref="/pricing"
        secondaryLabel="View pricing guide"
      />

      <LocationAndFooter />
    </main>
  );
}

function BarnsleyIndoorGolfPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero barnsley-golf-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Indoor golf Barnsley</p>
            <h1>Barnsley&apos;s upcoming indoor golf and social venue.</h1>
            <p>
              Tee Time Social is planned for Regent Street in Barnsley, bringing Golfzon
              simulator technology, coaching, live sport, food, drink, private hire and
              memberships to the town centre.
            </p>

            <div className="hero-actions">
              <a href="/#register" className="button button-primary">Join Launch List</a>
              <a href="/book-simulator" className="button button-secondary">Book Simulator</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Location</span>
            <strong>Barnsley S70 2HJ</strong>
            <p>Tee Time Social, Regent St, Barnsley. Opening Autumn 2026.</p>
          </div>
        </div>
      </section>

      <section className="section local-seo-section">
        <div className="container local-seo-grid">
          <article><span>Play</span><h3>Golf simulator bookings</h3><p>Book 30, 60 or 90 minute simulator sessions for up to six players per bay.</p></article>
          <article><span>Improve</span><h3>Coaching and GDR Max</h3><p>Register interest for practice sessions, lessons and player development.</p></article>
          <article><span>Social</span><h3>Food, drink and live sport</h3><p>Use Tee Time Social for nights out, live sport and social events.</p></article>
          <article><span>Events</span><h3>Private hire in Barnsley</h3><p>Send enquiries for birthdays, corporate events, societies and group bookings.</p></article>
        </div>
      </section>

      <GuideCTA
        eyebrow="Barnsley launch"
        title="Want to hear when bookings go live?"
        body="Join the launch list for early access, opening updates, membership news and launch offers."
        primaryHref="/#register"
        primaryLabel="Join launch list"
        secondaryHref="/venue"
        secondaryLabel="Explore venue"
      />

      <LocationAndFooter />
    </main>
  );
}



function PlanYourVisitPage() {
  return (
    <main>
      <Navigation />
      <Breadcrumbs current="Plan Your Visit" />

      <section className="page-hero visit-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Plan your visit</p>
            <h1>Everything visitors need before their first Tee Time Social session.</h1>
            <p>
              A practical visitor guide covering location, what to bring, group sizes,
              simulator sessions, under 18s, club hire and what happens after booking.
            </p>

            <div className="hero-actions">
              <a href="/book-simulator" className="button button-primary">Book Simulator</a>
              <a href="/#register" className="button button-secondary">Join Launch List</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Location</span>
            <strong>Regent Street</strong>
            <p>Tee Time Social, Regent St, Barnsley S70 2HJ. Opening Autumn 2026.</p>
          </div>
        </div>
      </section>

      <section className="section visitor-guide-section">
        <div className="container visitor-guide-grid">
          <article><span>01</span><h3>Before you arrive</h3><p>Book a 30, 60 or 90 minute simulator session, choose a bay, add group size and request club hire if needed.</p></article>
          <article><span>02</span><h3>What to bring</h3><p>Bring your own clubs if you have them. Club hire can be requested during the booking journey.</p></article>
          <article><span>03</span><h3>Group sizes</h3><p>Each simulator booking supports up to six players per bay, making it suitable for friends, families and small groups.</p></article>
          <article><span>04</span><h3>Under 18s</h3><p>Under 18s are welcome when accompanied by a responsible adult.</p></article>
        </div>
      </section>

      <section className="section visit-flow-section">
        <div className="container visit-flow-grid">
          <div>
            <p className="eyebrow">Visit flow</p>
            <h2>A simple journey from booking to playing.</h2>
            <p>Clear visitor information reduces friction and helps more people feel confident booking before the venue opens.</p>
          </div>

          <div className="visit-flow-list">
            <div><strong>Book or enquire</strong><span>Choose simulator time, private hire, membership or launch-list interest.</span></div>
            <div><strong>Receive confirmation</strong><span>Admin and customer email confirmations support the current enquiry journey.</span></div>
            <div><strong>Arrive ready</strong><span>Bring clubs or request hire, check group numbers and arrive for your selected session.</span></div>
            <div><strong>Play and socialise</strong><span>Use the venue for golf, food, drink, live sport and events.</span></div>
          </div>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}

function HouseRulesPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero house-rules-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">House rules</p>
            <h1>Simple rules for a safe, premium and enjoyable venue.</h1>
            <p>
              Clear house rules help guests understand expectations before booking,
              especially around simulator safety, under 18s, group behaviour and equipment.
            </p>

            <div className="hero-actions">
              <a href="/book-simulator" className="button button-primary">Book Simulator</a>
              <a href="/faq" className="button button-secondary">Read FAQs</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Important</span>
            <strong>Under 18s</strong>
            <p>Anyone under 18 must be accompanied by a responsible adult while visiting.</p>
          </div>
        </div>
      </section>

      <section className="section rules-section">
        <div className="container rules-grid">
          <article><span>Safety</span><h3>Simulator bay safety</h3><p>Only one person should swing in the hitting area at a time. Guests should stay aware of clubs, balls and screens.</p></article>
          <article><span>Groups</span><h3>Respect other guests</h3><p>Keep group behaviour suitable for a premium social venue and follow staff guidance.</p></article>
          <article><span>Juniors</span><h3>Under 18 supervision</h3><p>Under 18s are welcome but must be accompanied by a responsible adult.</p></article>
          <article><span>Equipment</span><h3>Clubs and hire sets</h3><p>Bring your own clubs or request hire. Use equipment responsibly and report any issues to staff.</p></article>
          <article><span>Timings</span><h3>Arrive on time</h3><p>Booking times are limited to the selected duration, so arriving on time helps protect your session.</p></article>
          <article><span>Venue</span><h3>Food, drink and live sport</h3><p>Follow venue guidance for food, drink and event areas once full operating details are confirmed.</p></article>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}

function AccessibilityPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero accessibility-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Accessibility</p>
            <h1>Making Tee Time Social welcoming, clear and easy to understand.</h1>
            <p>
              Accessibility information will be updated as the venue fit-out progresses.
              This page gives visitors a place to check access notes and contact the team.
            </p>

            <div className="hero-actions">
              <a href="/contact" className="button button-primary">Contact Us</a>
              <a href="/plan-your-visit" className="button button-secondary">Plan Visit</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Access note</span>
            <strong>More details soon</strong>
            <p>Venue access information will be expanded before opening.</p>
          </div>
        </div>
      </section>

      <section className="section accessibility-section">
        <div className="container accessibility-grid">
          <div>
            <p className="eyebrow">Access planning</p>
            <h2>Contact us before visiting if you have access requirements.</h2>
            <p>
              The venue is still pre-opening, so detailed access information will be
              confirmed later. Until then, visitors can contact the team with questions.
            </p>
          </div>

          <div className="accessibility-list">
            <div><strong>Before opening</strong><span>Access information will be updated as the venue layout and facilities are confirmed.</span></div>
            <div><strong>Before booking</strong><span>Contact the team if you have questions about simulator use, mobility, sensory needs or group support.</span></div>
            <div><strong>Inclusive venue</strong><span>Tee Time Social aims to support golfers, beginners, families, juniors and social groups.</span></div>
          </div>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}

function CareersPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero careers-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Careers</p>
            <h1>Future roles at Tee Time Social.</h1>
            <p>
              As launch approaches, Tee Time Social will need people who care about
              hospitality, golf, events, coaching support, customer service and venue operations.
            </p>

            <div className="hero-actions">
              <a href="mailto:info@teetimesocial.co.uk" className="button button-primary">Email Interest</a>
              <a href="/launch" className="button button-secondary">Launch Updates</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Hiring status</span>
            <strong>Not open yet</strong>
            <p>Register future interest by emailing the team. Roles will be confirmed closer to launch.</p>
          </div>
        </div>
      </section>

      <section className="section careers-section">
        <div className="container careers-grid">
          <article><span>Hospitality</span><h3>Venue team</h3><p>Customer service, bar, floor and guest experience roles may be needed before opening.</p></article>
          <article><span>Golf</span><h3>Simulator hosts</h3><p>Support guests using simulator bays, group bookings and social golf experiences.</p></article>
          <article><span>Events</span><h3>Events support</h3><p>Private hire, corporate events, birthdays, live sport nights and group packages.</p></article>
          <article><span>Coaching</span><h3>Golf pathway</h3><p>Coaching, GDR Max, lessons and junior golf opportunities may be developed closer to launch.</p></article>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}

function PartnershipsPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero partnerships-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Partnerships</p>
            <h1>Partnership opportunities with Tee Time Social.</h1>
            <p>
              Tee Time Social can become a local platform for corporate events, supplier
              relationships, community activity, golf partnerships and launch collaborations.
            </p>

            <div className="hero-actions">
              <a href="mailto:info@teetimesocial.co.uk" className="button button-primary">Email Partnership Idea</a>
              <a href="/corporate" className="button button-secondary">Corporate Events</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Partnerships</span>
            <strong>Open to ideas</strong>
            <p>Contact the team with local, corporate, golf, supplier or launch partnership opportunities.</p>
          </div>
        </div>
      </section>

      <section className="section partnerships-section">
        <div className="container partnerships-grid">
          <article><span>Corporate</span><h3>Business partnerships</h3><p>Recurring company events, staff rewards, client nights and local business collaborations.</p></article>
          <article><span>Golf</span><h3>Golf relationships</h3><p>Societies, coaches, local clubs, leagues and golf community partnerships.</p></article>
          <article><span>Community</span><h3>Local activity</h3><p>Community projects, youth sport, charity activity and local launch partnerships.</p></article>
          <article><span>Supplier</span><h3>Food, drink and venue suppliers</h3><p>Supplier conversations can be shaped before launch as the venue offer develops.</p></article>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}

function PressPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero press-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Press</p>
            <h1>Press information for Tee Time Social.</h1>
            <p>
              A simple press page gives journalists, partners and local organisations a
              clear overview of the upcoming Barnsley indoor golf and social venue.
            </p>

            <div className="hero-actions">
              <a href="mailto:info@teetimesocial.co.uk" className="button button-primary">Press Enquiry</a>
              <a href="/venue" className="button button-secondary">Venue Overview</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Press contact</span>
            <strong>Email team</strong>
            <p>info@teetimesocial.co.uk</p>
          </div>
        </div>
      </section>

      <section className="section press-section">
        <div className="container press-grid">
          <article><span>Business</span><h3>Opening Autumn 2026</h3><p>Tee Time Social is planned as Barnsley's premium indoor golf and social venue.</p></article>
          <article><span>Technology</span><h3>Golfzon simulators</h3><p>The venue is planned to feature four Golfzon TwoVision bays and one GDR Max studio.</p></article>
          <article><span>Location</span><h3>Barnsley town centre</h3><p>The venue address is Tee Time Social, Regent St, Barnsley S70 2HJ.</p></article>
          <article><span>Offer</span><h3>Golf, coaching, events and live sport</h3><p>The concept combines simulator golf, coaching, food, drink, memberships and private hire.</p></article>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}



function PackageCTA({
  eyebrow,
  title,
  body,
  primaryHref = "/#register",
  primaryLabel = "Join launch list",
  secondaryHref = "/events#event-enquiry",
  secondaryLabel = "Send enquiry"
}: {
  eyebrow: string;
  title: string;
  body: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="section package-cta-section">
      <div className="container package-cta-card">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{body}</p>
        </div>

        <div className="package-cta-actions">
          <a href={primaryHref} className="button button-primary">{primaryLabel}</a>
          <a href={secondaryHref} className="button button-secondary">{secondaryLabel}</a>
        </div>
      </div>
    </section>
  );
}

function PackagesPage() {
  return (
    <main>
      <Navigation />
      <Breadcrumbs current="Packages" />

      <section className="page-hero packages-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Packages</p>
            <h1>Packages for play, practice, parties, business and launch members.</h1>
            <p>
              Final package prices will be confirmed closer to opening. This page gives
              visitors a clear overview of the main package types Tee Time Social is shaping.
            </p>

            <div className="hero-actions">
              <a href="/book-simulator" className="button button-primary">Book Simulator</a>
              <a href="/events#event-enquiry" className="button button-secondary">Event Enquiry</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Package status</span>
            <strong>Being shaped</strong>
            <p>Register interest now to help shape launch packages and receive early updates.</p>
          </div>
        </div>
      </section>

      <section className="section package-hub-section">
        <div className="container package-hub-grid">
          <a href="/book-simulator" className="package-hub-card"><span>Play</span><h3>Simulator sessions</h3><p>30, 60 or 90 minute simulator bookings for up to six players per bay.</p></a>
          <a href="/founding-members" className="package-hub-card"><span>Belong</span><h3>Founding members</h3><p>Early membership interest, priority updates and launch-list benefits.</p></a>
          <a href="/events" className="package-hub-card"><span>Groups</span><h3>Parties & private hire</h3><p>Birthdays, celebrations, corporate socials, societies and seasonal events.</p></a>
          <a href="/team-building" className="package-hub-card"><span>Business</span><h3>Team building</h3><p>Interactive corporate nights, staff rewards and client entertainment.</p></a>
          <a href="/coaching" className="package-hub-card"><span>Improve</span><h3>Coaching & GDR Max</h3><p>Practice, lessons, junior coaching and data-led improvement interest.</p></a>
          <a href="/winter-golf" className="package-hub-card"><span>Seasonal</span><h3>Winter golf</h3><p>Year-round indoor golf when daylight, weather and course conditions are difficult.</p></a>
        </div>
      </section>

      <PackageCTA
        eyebrow="Package interest"
        title="Want package updates first?"
        body="Join the launch list and choose the updates that match how you plan to use Tee Time Social."
        primaryHref="/#register"
        primaryLabel="Join launch list"
        secondaryHref="/pricing"
        secondaryLabel="Pricing guide"
      />

      <LocationAndFooter />
    </main>
  );
}

function FoundingMembersPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero founding-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Founding members</p>
            <h1>Be part of Tee Time Social from the beginning.</h1>
            <p>
              Founding membership interest helps shape early access, member benefits,
              league demand and launch offers before packages are finalised.
            </p>

            <div className="hero-actions">
              <a href="/memberships#membership-form" className="button button-primary">Join Waiting List</a>
              <a href="/launch-offers" className="button button-secondary">Launch Offers</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Membership</span>
            <strong>Waiting list open</strong>
            <p>Membership packages are not final yet, but founding member interest is being captured now.</p>
          </div>
        </div>
      </section>

      <section className="section founding-benefits-section">
        <div className="container founding-benefits-grid">
          <article><span>01</span><h3>Priority updates</h3><p>Hear about membership releases, launch offers and early booking access before wider promotion.</p></article>
          <article><span>02</span><h3>League pathway</h3><p>Register interest in regular play, competitions, society nights and future indoor leagues.</p></article>
          <article><span>03</span><h3>Practice pathway</h3><p>Signal interest in simulator practice, coaching, GDR Max and improvement sessions.</p></article>
          <article><span>04</span><h3>Community launch</h3><p>Help build the first community of golfers, social guests and local supporters.</p></article>
        </div>
      </section>

      <PackageCTA
        eyebrow="Member interest"
        title="Join the founding member waiting list."
        body="Submit your details and choose the membership type you are most interested in."
        primaryHref="/memberships#membership-form"
        primaryLabel="Join waiting list"
        secondaryHref="/leagues"
        secondaryLabel="League interest"
      />

      <LocationAndFooter />
    </main>
  );
}

function LaunchOffersPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero launch-offers-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Launch offers</p>
            <h1>Opening offers, giveaways and early-access campaigns.</h1>
            <p>
              Launch offers are not final yet, but the website can now explain what
              visitors may receive by joining early: booking access, membership updates,
              event package news and promotional announcements.
            </p>

            <div className="hero-actions">
              <a href="/#register" className="button button-primary">Join Launch List</a>
              <a href="/packages" className="button button-secondary">View Packages</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Launch</span>
            <strong>Autumn 2026</strong>
            <p>Register early so Tee Time Social can contact you when offers are released.</p>
          </div>
        </div>
      </section>

      <section className="section offer-ladder-section">
        <div className="container offer-ladder-grid">
          <div><strong>Early booking access</strong><span>Be first to hear when simulator booking windows open.</span></div>
          <div><strong>Founding member release</strong><span>Receive membership updates before the public launch.</span></div>
          <div><strong>Event package news</strong><span>Hear about private hire, corporate and group packages.</span></div>
          <div><strong>Giveaways and launch offers</strong><span>Receive promotional updates once confirmed.</span></div>
        </div>
      </section>

      <PackageCTA
        eyebrow="Launch updates"
        title="Get on the list before offers go public."
        body="Register once and choose the interests that matter to you."
        primaryHref="/#register"
        primaryLabel="Join launch list"
        secondaryHref="/gift-vouchers"
        secondaryLabel="Gift interest"
      />

      <LocationAndFooter />
    </main>
  );
}

function TeamBuildingPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero team-building-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Team building</p>
            <h1>Corporate team building with indoor golf, live sport and social competition.</h1>
            <p>
              Tee Time Social gives local businesses a more interactive option for team
              socials, client entertainment and staff rewards in Barnsley.
            </p>

            <div className="hero-actions">
              <a href="/events#event-enquiry" className="button button-primary">Send Business Enquiry</a>
              <a href="/corporate" className="button button-secondary">Corporate Page</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Corporate</span>
            <strong>Team nights</strong>
            <p>Useful for staff socials, departments, clients, suppliers and recurring business events.</p>
          </div>
        </div>
      </section>

      <section className="section team-building-section">
        <div className="container team-building-grid">
          <article><span>01</span><h3>Inclusive competition</h3><p>Simulator golf creates simple team formats that work for golfers and non-golfers.</p></article>
          <article><span>02</span><h3>Client entertainment</h3><p>A relaxed premium venue for clients, partners and suppliers.</p></article>
          <article><span>03</span><h3>Staff rewards</h3><p>Reward teams with something more memorable than a standard meal or bar booking.</p></article>
          <article><span>04</span><h3>Recurring events</h3><p>Shape demand for monthly socials, leagues and company-versus-company competitions.</p></article>
        </div>
      </section>

      <PackageCTA
        eyebrow="Business enquiry"
        title="Planning a team night?"
        body="Send your preferred date, group size and event type so the team can shape the right package."
        primaryHref="/events#event-enquiry"
        primaryLabel="Send enquiry"
        secondaryHref="/venue-hire-guide"
        secondaryLabel="Hire guide"
      />

      <LocationAndFooter />
    </main>
  );
}

function JuniorGolfPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero junior-golf-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Junior golf</p>
            <h1>Junior golf interest for accompanied young players and families.</h1>
            <p>
              Tee Time Social will welcome juniors when accompanied by an adult, with
              future interest open for junior coaching, family sessions and beginner-friendly activity.
            </p>

            <div className="hero-actions">
              <a href="/coaching" className="button button-primary">Coaching Interest</a>
              <a href="/family-juniors" className="button button-secondary">Family Page</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Under 18s</span>
            <strong>Adult required</strong>
            <p>Young players are welcome when accompanied by a responsible adult.</p>
          </div>
        </div>
      </section>

      <section className="section junior-pathway-section">
        <div className="container junior-pathway-grid">
          <article><span>Start</span><h3>Beginner-friendly sessions</h3><p>Indoor golf makes it easier for juniors and new players to try the game.</p></article>
          <article><span>Learn</span><h3>Coaching interest</h3><p>Register interest in future coaching, junior sessions and school holiday activity.</p></article>
          <article><span>Play</span><h3>Family bay bookings</h3><p>Families can book simulator time for accompanied juniors and group activity.</p></article>
          <article><span>Improve</span><h3>Practice pathway</h3><p>GDR Max interest can support juniors who want more structured practice later.</p></article>
        </div>
      </section>

      <PackageCTA
        eyebrow="Junior interest"
        title="Want junior and family updates?"
        body="Join the launch list and select coaching, memberships or family interest."
        primaryHref="/#register"
        primaryLabel="Join launch list"
        secondaryHref="/coaching"
        secondaryLabel="Coaching page"
      />

      <LocationAndFooter />
    </main>
  );
}

function WinterGolfPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero winter-golf-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Winter golf</p>
            <h1>Keep playing when the weather, daylight and course conditions are against you.</h1>
            <p>
              Tee Time Social gives golfers and groups a year-round indoor option for
              practice, social rounds, leagues, societies and winter competitions.
            </p>

            <div className="hero-actions">
              <a href="/book-simulator" className="button button-primary">Book Simulator</a>
              <a href="/leagues" className="button button-secondary">League Interest</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>All-weather golf</span>
            <strong>Indoor play</strong>
            <p>Useful for winter practice, society nights, lessons and group competitions.</p>
          </div>
        </div>
      </section>

      <section className="section winter-golf-section">
        <div className="container winter-golf-grid">
          <article><span>Practice</span><h3>Stay sharp</h3><p>Use simulator sessions to keep swinging when outdoor practice is limited.</p></article>
          <article><span>Social</span><h3>Winter nights out</h3><p>Combine indoor golf with food, drinks and live sport.</p></article>
          <article><span>Leagues</span><h3>Indoor competitions</h3><p>Register interest for winter leagues, closest-to-pin nights and group events.</p></article>
          <article><span>Coaching</span><h3>Improve indoors</h3><p>Use coaching and GDR Max practice interest to build a more structured winter plan.</p></article>
        </div>
      </section>

      <PackageCTA
        eyebrow="Winter golf"
        title="Want winter golf updates?"
        body="Join the launch list for simulator access, leagues and practice announcements."
        primaryHref="/#register"
        primaryLabel="Join launch list"
        secondaryHref="/book-simulator"
        secondaryLabel="Book simulator"
      />

      <LocationAndFooter />
    </main>
  );
}



function BookingSupportCTA({
  eyebrow,
  title,
  body,
  primaryHref = "/book-simulator",
  primaryLabel = "Book simulator",
  secondaryHref = "/#register",
  secondaryLabel = "Join launch list"
}: {
  eyebrow: string;
  title: string;
  body: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="section booking-support-cta-section">
      <div className="container booking-support-cta-card">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{body}</p>
        </div>
        <div className="booking-support-actions">
          <a href={primaryHref} className="button button-primary">{primaryLabel}</a>
          <a href={secondaryHref} className="button button-secondary">{secondaryLabel}</a>
        </div>
      </div>
    </section>
  );
}

function HowBookingWorksPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero booking-guide-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">How booking works</p>
            <h1>How to request a Tee Time Social simulator booking.</h1>
            <p>
              A clear guide for choosing session length, group size, simulator bay, club hire
              and what happens after the booking request is submitted.
            </p>
            <div className="hero-actions">
              <a href="/book-simulator" className="button button-primary">Start Booking</a>
              <a href="/booking-faq" className="button button-secondary">Booking FAQ</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Booking status</span>
            <strong>Request first</strong>
            <p>The current flow saves booking requests and prevents duplicate slot bookings.</p>
          </div>
        </div>
      </section>

      <section className="section booking-guide-page-section">
        <div className="container booking-guide-steps">
          <article><span>01</span><h3>Choose your session</h3><p>Pick 30, 60 or 90 minutes depending on how much time your group needs.</p></article>
          <article><span>02</span><h3>Select date and simulator</h3><p>Availability updates based on the selected date and bay.</p></article>
          <article><span>03</span><h3>Pick a time slot</h3><p>Unavailable slots are disabled automatically to reduce double bookings.</p></article>
          <article><span>04</span><h3>Add guest details</h3><p>Enter contact details, group size, club hire request and useful notes.</p></article>
          <article><span>05</span><h3>Receive confirmation</h3><p>The request is saved and email notifications are sent.</p></article>
        </div>
      </section>

      <BookingSupportCTA
        eyebrow="Ready"
        title="Start your booking request."
        body="Choose a slot and submit your details. Final payment can be added later."
      />

      <LocationAndFooter />
    </main>
  );
}

function SimulatorGuidePage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero simulator-guide-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Simulator guide</p>
            <h1>Choose the right simulator experience.</h1>
            <p>
              Tee Time Social is planned around four Golfzon TwoVision bays and one
              Golfzon GDR Max studio, giving customers clear options for play and practice.
            </p>
            <div className="hero-actions">
              <a href="/book-simulator" className="button button-primary">Book Simulator</a>
              <a href="/what-is-golfzon" className="button button-secondary">What is Golfzon?</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Venue setup</span>
            <strong>5 simulator spaces</strong>
            <p>Four social play bays plus one dedicated coaching and practice studio.</p>
          </div>
        </div>
      </section>

      <section className="section simulator-choice-section">
        <div className="container simulator-choice-grid">
          <article><span>TwoVision</span><h3>Bays 1-4</h3><p>Best for casual play, groups, competitions, parties, societies and social golf.</p></article>
          <article><span>GDR Max</span><h3>Bay 5 studio</h3><p>Best for practice, coaching interest, swing data and more structured improvement.</p></article>
          <article><span>Group play</span><h3>Up to six players</h3><p>Suitable for friends, family groups, date nights and corporate sessions.</p></article>
          <article><span>Beginner friendly</span><h3>No handicap needed</h3><p>First-time golfers and non-golfers can enjoy simulator golf in a social setting.</p></article>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}

function ClubHirePage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero club-hire-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Club hire</p>
            <h1>Bring your own clubs or request club hire.</h1>
            <p>
              The booking journey lets guests request club hire and tell us whether
              right-handed or left-handed clubs are needed.
            </p>
            <div className="hero-actions">
              <a href="/book-simulator" className="button button-primary">Book Simulator</a>
              <a href="/first-time-golfers" className="button button-secondary">First-Time Golfers</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Booking option</span>
            <strong>Club hire request</strong>
            <p>Tick the club hire box during booking and select right or left handed clubs.</p>
          </div>
        </div>
      </section>

      <section className="section club-hire-section">
        <div className="container club-hire-grid">
          <article><span>Bring clubs</span><h3>Use your own set</h3><p>Golfers can bring their own clubs for simulator bookings and practice sessions.</p></article>
          <article><span>Request hire</span><h3>Need clubs?</h3><p>Tick club hire during booking and tell us right or left handed.</p></article>
          <article><span>Beginners</span><h3>Trying golf?</h3><p>Club hire makes the experience more accessible for guests without their own set.</p></article>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}

function GroupBookingsPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero group-bookings-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Group bookings</p>
            <h1>Book simulator golf for friends, parties, societies and teams.</h1>
            <p>
              Each simulator booking supports up to six players per bay. Larger groups
              can use event enquiry routes for private hire or multi-bay packages.
            </p>
            <div className="hero-actions">
              <a href="/book-simulator" className="button button-primary">Book a Bay</a>
              <a href="/events#event-enquiry" className="button button-secondary">Group Enquiry</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Group size</span>
            <strong>Up to 6 per bay</strong>
            <p>For larger parties, send an event enquiry so the package can be shaped.</p>
          </div>
        </div>
      </section>

      <section className="section group-bookings-section">
        <div className="container group-bookings-grid">
          <article><span>1 bay</span><h3>Small groups</h3><p>Friends, date nights, families and casual social golf.</p></article>
          <article><span>Multiple bays</span><h3>Large groups</h3><p>Birthdays, societies, corporate teams and private hire enquiries.</p></article>
          <article><span>Events</span><h3>Food, drink and live sport</h3><p>Event packages can be shaped around guest count and occasion.</p></article>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}

function FirstTimeGolfersPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero first-time-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">First-time golfers</p>
            <h1>You do not need to be a golfer to enjoy Tee Time Social.</h1>
            <p>
              Simulator golf is beginner friendly, social and easy to try. Guests can
              request club hire, book shorter sessions and visit with experienced players.
            </p>
            <div className="hero-actions">
              <a href="/book-simulator" className="button button-primary">Book a First Visit</a>
              <a href="/date-night" className="button button-secondary">Date Night Ideas</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>New golfers</span>
            <strong>Welcome</strong>
            <p>Choose 30 minutes for a quick first try or 60 minutes for a more relaxed visit.</p>
          </div>
        </div>
      </section>

      <section className="section first-time-section">
        <div className="container first-time-grid">
          <article><span>Easy start</span><h3>Book 30 minutes</h3><p>A short session is a good first step if you are trying simulator golf for the first time.</p></article>
          <article><span>No clubs?</span><h3>Request club hire</h3><p>Use the booking form to tell us if you need right or left handed clubs.</p></article>
          <article><span>Bring friends</span><h3>Social format</h3><p>Simulator golf works well for friends, couples, families and groups with mixed ability.</p></article>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}

function BookingFAQPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero booking-faq-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Booking FAQ</p>
            <h1>Booking questions answered.</h1>
            <p>
              Quick answers about simulator booking length, deposits, group size,
              club hire, under 18s and what happens after submitting a request.
            </p>
            <div className="hero-actions">
              <a href="/book-simulator" className="button button-primary">Book Simulator</a>
              <a href="/how-booking-works" className="button button-secondary">How It Works</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Need help?</span>
            <strong>Contact us</strong>
            <p>Email info@teetimesocial.co.uk if your question is not answered here.</p>
          </div>
        </div>
      </section>

      <section className="section booking-faq-section">
        <div className="container faq-accordion">
          <details open><summary>How many players can use one bay?</summary><p>Each simulator booking supports up to six players per bay.</p></details>
          <details><summary>What session lengths are available?</summary><p>The current booking options are 30, 60 and 90 minutes.</p></details>
          <details><summary>Is payment taken online?</summary><p>Not yet. The current system saves booking requests and deposit estimates. Payment can be added later.</p></details>
          <details><summary>Can I request club hire?</summary><p>Yes. Tick the club hire option and select right-handed or left-handed clubs.</p></details>
          <details><summary>Can under 18s visit?</summary><p>Yes. Under 18s are welcome when accompanied by a responsible adult.</p></details>
          <details><summary>What happens after I submit a request?</summary><p>Your request is saved, the slot is protected against double booking and notification emails are sent.</p></details>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}


function FAQPage() {
  return (
    <main>
      <Navigation />

      <section className="page-hero faq-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">FAQs</p>
            <h1>Frequently asked questions.</h1>
            <p>
              Clear answers for simulator bookings, memberships, coaching, events,
              under 18s, club hire and the Tee Time Social launch.
            </p>
          </div>

          <div className="booking-summary-card">
            <span>Opening</span>
            <strong>Autumn 2026</strong>
            <p>Register interest now for early access, launch offers and booking updates.</p>
          </div>
        </div>
      </section>

      <section className="section faq-page-section">
        <div className="container faq-page-grid">
          <aside className="faq-sidebar">
            <p className="eyebrow">Need help?</p>
            <h2>Still got a question?</h2>
            <p>Email the team and we&apos;ll come back to you.</p>
            <a href="mailto:info@teetimesocial.co.uk" className="button button-primary">Email Us</a>
          </aside>

          <div className="faq-accordion">
            <details open>
              <summary>When is Tee Time Social opening?</summary>
              <p>Tee Time Social is planned to open in Autumn 2026 in Barnsley.</p>
            </details>

            <details>
              <summary>Where is Tee Time Social?</summary>
              <p>The venue address is Tee Time Social, Regent Street, Barnsley S70 2HJ.</p>
            </details>

            <details>
              <summary>What simulator technology will you have?</summary>
              <p>The venue is planned to feature four Golfzon TwoVision simulator bays and one Golfzon GDR Max studio for coaching and practice.</p>
            </details>

            <details>
              <summary>How long can I book for?</summary>
              <p>Current booking options are 30, 60 or 90 minutes.</p>
            </details>

            <details>
              <summary>How many people can play in one simulator bay?</summary>
              <p>Each booking supports up to six players per simulator bay.</p>
            </details>

            <details>
              <summary>Can beginners and non-golfers come?</summary>
              <p>Yes. Tee Time Social is for golfers, beginners and social groups. You do not need to be an experienced golfer to visit.</p>
            </details>

            <details>
              <summary>Will club hire be available?</summary>
              <p>Players can bring their own clubs, and club hire can be requested when submitting a booking request.</p>
            </details>

            <details>
              <summary>Are under 18s allowed?</summary>
              <p>Yes, under 18s are welcome but must be accompanied by an adult.</p>
            </details>

            <details>
              <summary>Can I book private hire or events?</summary>
              <p>Yes. Private hire enquiries are open for birthdays, corporate events, golf societies, live sport bookings, celebrations and group nights out.</p>
            </details>

            <details>
              <summary>Are memberships available?</summary>
              <p>The membership waiting list is open. Register your interest to receive founding member updates and early information.</p>
            </details>

            <details>
              <summary>Will coaching be available?</summary>
              <p>Yes. Coaching and practice enquiries are open, with the Golfzon GDR Max studio planned for data-led practice and player improvement.</p>
            </details>

            <details>
              <summary>Do online bookings take payment now?</summary>
              <p>Not yet. The current booking system records booking requests and deposit estimates. Payment and final confirmation can be added later.</p>
            </details>
          </div>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}




function SiteMapPage() {
  const sections = [
    {
      title: "Core pages",
      links: [
        ["/", "Home"],
        ["/venue", "Venue"],
        ["/book-simulator", "Book Simulator"],
        ["/packages", "Packages"],
        ["/pricing", "Pricing"],
        ["/contact", "Contact"]
      ]
    },
    {
      title: "Bookings and customers",
      links: [
        ["/how-booking-works", "How Booking Works"],
        ["/simulator-guide", "Simulator Guide"],
        ["/club-hire", "Club Hire"],
        ["/group-bookings", "Group Bookings"],
        ["/first-time-golfers", "First-Time Golfers"],
        ["/booking-faq", "Booking FAQ"]
      ]
    },
    {
      title: "Events and packages",
      links: [
        ["/events", "Events"],
        ["/parties", "Parties"],
        ["/golf-societies", "Golf Societies"],
        ["/date-night", "Date Night"],
        ["/christmas-parties", "Christmas Parties"],
        ["/team-building", "Team Building"]
      ]
    },
    {
      title: "Guides and trust",
      links: [
        ["/guides", "Guides"],
        ["/plan-your-visit", "Plan Your Visit"],
        ["/house-rules", "House Rules"],
        ["/accessibility", "Accessibility"],
        ["/careers", "Careers"],
        ["/press", "Press"]
      ]
    }
  ];

  return (
    <main>
      <Navigation />
      <Breadcrumbs current="Site Map" />

      <section className="page-hero sitemap-hero">
        <div className="container">
          <p className="eyebrow">Site map</p>
          <h1>Find every Tee Time Social page.</h1>
          <p>A human-friendly site map for visitors, search engines and internal checking.</p>
        </div>
      </section>

      <section className="section sitemap-page-section">
        <div className="container sitemap-page-grid">
          {sections.map((section) => (
            <article key={section.title}>
              <h2>{section.title}</h2>
              {section.links.map(([href, label]) => (
                <a key={href} href={href}>{label}</a>
              ))}
            </article>
          ))}
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}


function NotFoundPage() {
  return (
    <main>
      <Navigation />
      <Breadcrumbs current="Page Not Found" />

      <section className="page-hero not-found-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">404</p>
            <h1>That page has gone out of bounds.</h1>
            <p>
              The page you are looking for does not exist, but you can still book a simulator,
              join the launch list, explore packages or send an event enquiry.
            </p>

            <div className="hero-actions">
              <a href="/" className="button button-primary">Go Home</a>
              <a href="/book-simulator" className="button button-secondary">Book Simulator</a>
            </div>
          </div>

          <div className="booking-summary-card">
            <span>Useful links</span>
            <strong>Start here</strong>
            <p>Use the links below to find the right Tee Time Social page.</p>
          </div>
        </div>
      </section>

      <section className="section not-found-section">
        <div className="container not-found-grid">
          <a href="/packages"><span>Packages</span><strong>View packages</strong></a>
          <a href="/events"><span>Events</span><strong>Private hire</strong></a>
          <a href="/guides"><span>Guides</span><strong>Plan your visit</strong></a>
          <a href="/#register"><span>Launch</span><strong>Join launch list</strong></a>
        </div>
      </section>

      <LocationAndFooter />
    </main>
  );
}


function ProtectedAdminPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(sessionStorage.getItem("tts-admin-auth") === "true");

  const login = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("tts-admin-auth", "true");
      setLoggedIn(true);
      return;
    }
    alert("Incorrect password");
  };

  const logout = () => {
    sessionStorage.removeItem("tts-admin-auth");
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return (
      <main>
        <Navigation />
        <section className="section admin-login-section">
          <div className="container admin-login-card">
            <p className="eyebrow">Tee Time Social admin</p>
            <h1>Admin login</h1>
            <form className="lead-form" onSubmit={login}>
              <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
              <button className="button button-primary form-button" type="submit">Login</button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return <AdminPage onLogout={logout} />;
}

function AdminPage({ onLogout }: { onLogout: () => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [privateHires, setPrivateHires] = useState<PrivateHire[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [status, setStatus] = useState("Loading dashboard...");

  const fetchDashboard = async () => {
    setStatus("Loading dashboard...");

    const [leadResult, hireResult, bookingResult, membershipResult] = await Promise.all([
      supabase.from("leads").select("id, full_name, email, phone, interests, message, source, created_at").order("created_at", { ascending: false }),
      supabase.from("private_hire_enquiries").select("id, full_name, email, phone, event_type, preferred_date, guest_count, message, created_at").order("created_at", { ascending: false }),
      supabase.from("simulator_bookings").select("id, booking_reference, full_name, email, phone, booking_date, booking_time, booking_end_time, duration, group_size, simulator, club_hire, handedness, deposit_amount, booking_status, payment_status, notes, created_at").order("created_at", { ascending: false }),
      supabase.from("memberships").select("id, full_name, email, phone, membership_type, status, created_at").order("created_at", { ascending: false })
    ]);

    if (leadResult.error || hireResult.error || bookingResult.error || membershipResult.error) {
      setStatus("Unable to load dashboard. Check Supabase permissions.");
      return;
    }

    setLeads((leadResult.data ?? []) as Lead[]);
    setPrivateHires((hireResult.data ?? []) as PrivateHire[]);
    setBookings((bookingResult.data ?? []) as Booking[]);
    setMemberships((membershipResult.data ?? []) as Membership[]);
    setStatus("Dashboard loaded.");
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <div className="container admin-hero-inner">
          <div>
            <a href="/" className="admin-back">← Back to website</a>
            <p className="eyebrow">Tee Time Social admin</p>
            <h1>Dashboard</h1>
            <p>Manage leads, memberships, private hire enquiries and simulator booking requests.</p>
          </div>
          <div className="admin-actions">
            <button className="button button-secondary" type="button" onClick={fetchDashboard}>Refresh</button>
            <button className="button button-primary" type="button" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </section>

      <section className="admin-section section">
        <div className="container">
          <p className="admin-message">{status}</p>
          <div className="admin-stats">
            <div><strong>{leads.length}</strong><span>Leads</span></div>
            <div><strong>{privateHires.length}</strong><span>Private hire</span></div>
            <div><strong>{bookings.length}</strong><span>Bookings</span></div>
            <div><strong>{memberships.length}</strong><span>Memberships</span></div>
          </div>

          <AdminOverviewPanel leads={leads} privateHires={privateHires} bookings={bookings} memberships={memberships} />

          <AdminBayPlanner bookings={bookings} />

          <AdminBookings bookings={bookings} onChanged={fetchDashboard} />
          <AdminMemberships memberships={memberships} onChanged={fetchDashboard} />
          <AdminPrivateHires privateHires={privateHires} />
          <AdminLeads leads={leads} />
        </div>
      </section>
    </main>
  );
}

function AdminBayPlanner({ bookings }: { bookings: Booking[] }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const liveBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const status = booking.booking_status ?? "pending";
      return booking.booking_date === selectedDate && status !== "cancelled";
    });
  }, [bookings, selectedDate]);

  const bookingForSlot = (simulator: string, time: string) => {
    return liveBookings.find((booking) => {
      const start = booking.booking_time;
      const end = booking.booking_end_time ?? addMinutesToTime(booking.booking_time, booking.duration);
      return booking.simulator === simulator && time >= start && time < end;
    });
  };

  const bayCounts = simulators.map((simulator) => {
    return {
      simulator,
      count: liveBookings.filter((booking) => booking.simulator === simulator).length
    };
  });

  return (
    <div className="admin-card bay-planner-card">
      <div className="admin-card-header">
        <div>
          <h2>Simulator bay planner</h2>
          <p className="admin-inline-message">Visual day view for bay occupancy and open time slots.</p>
        </div>

        <label className="bay-planner-date">
          View date
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
      </div>

      <div className="bay-planner-summary">
        <span>{liveBookings.length} live bookings</span>
        {bayCounts.map((bay) => (
          <span key={bay.simulator}>{bay.simulator.replace(" - Golfzon", "")}: {bay.count}</span>
        ))}
      </div>

      <div className="bay-planner-scroll">
        <div className="bay-planner-grid" style={{ gridTemplateColumns: `170px repeat(${timeSlots.length}, 82px)` }}>
          <div className="bay-planner-corner">Bay</div>
          {timeSlots.map((slot) => (
            <div className="bay-planner-time" key={slot}>{slot}</div>
          ))}

          {simulators.map((simulator) => (
            <div className="bay-planner-row" key={simulator}>
              <div className="bay-planner-bay">{simulator.replace(" - Golfzon", "")}</div>

              {timeSlots.map((slot) => {
                const booking = bookingForSlot(simulator, slot);
                const status = booking?.booking_status ?? "open";

                return (
                  <div
                    className={booking ? `bay-planner-slot booked status-${status}` : "bay-planner-slot open"}
                    key={`${simulator}-${slot}`}
                    title={booking ? `${booking.full_name} · ${booking.booking_reference ?? "No ref"} · ${booking.booking_time}` : "Available"}
                  >
                    {booking ? (
                      <>
                        <strong>{booking.group_size}p</strong>
                        <span>{booking.booking_time}</span>
                      </>
                    ) : (
                      <span>Open</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="bay-planner-legend">
        <span><i className="legend-open"></i>Open</span>
        <span><i className="legend-pending"></i>Pending</span>
        <span><i className="legend-confirmed"></i>Confirmed</span>
        <span><i className="legend-completed"></i>Completed</span>
      </div>
    </div>
  );
}


function AdminOverviewPanel({
  leads,
  privateHires,
  bookings,
  memberships
}: {
  leads: Lead[];
  privateHires: PrivateHire[];
  bookings: Booking[];
  memberships: Membership[];
}) {
  const todayIso = new Date().toISOString().slice(0, 10);

  const liveBookings = bookings.filter((booking) => booking.booking_status !== "cancelled");
  const todayBookings = liveBookings.filter((booking) => booking.booking_date === todayIso);
  const upcomingBookings = liveBookings.filter((booking) => booking.booking_date >= todayIso);
  const pendingBookings = bookings.filter((booking) => (booking.booking_status ?? "pending") === "pending");
  const confirmedBookings = bookings.filter((booking) => booking.booking_status === "confirmed");

  const estimatedDeposits = liveBookings.reduce((total, booking) => total + Number(booking.deposit_amount ?? 0), 0);

  const newestLeads = leads.slice(0, 4);
  const newestBookings = upcomingBookings
    .slice()
    .sort((a, b) => `${a.booking_date} ${a.booking_time}`.localeCompare(`${b.booking_date} ${b.booking_time}`))
    .slice(0, 5);

  const membershipBreakdown = memberships.reduce<Record<string, number>>((acc, member) => {
    const key = member.membership_type || "Unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const topMembershipInterest = Object.entries(membershipBreakdown).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="admin-overview">
      <div className="admin-overview-grid">
        <article className="admin-overview-card admin-overview-highlight">
          <span>Today</span>
          <strong>{todayBookings.length}</strong>
          <p>Simulator bookings scheduled for today.</p>
        </article>

        <article className="admin-overview-card">
          <span>Upcoming</span>
          <strong>{upcomingBookings.length}</strong>
          <p>Live bookings still ahead in the diary.</p>
        </article>

        <article className="admin-overview-card">
          <span>Pending</span>
          <strong>{pendingBookings.length}</strong>
          <p>Bookings waiting to be confirmed.</p>
        </article>

        <article className="admin-overview-card">
          <span>Deposits</span>
          <strong>£{estimatedDeposits.toFixed(0)}</strong>
          <p>Estimated deposits across live bookings.</p>
        </article>
      </div>

      <div className="admin-overview-panels">
        <article className="admin-overview-panel">
          <div className="admin-overview-panel-header">
            <h3>Next bookings</h3>
            <span>{confirmedBookings.length} confirmed</span>
          </div>

          <div className="admin-mini-list">
            {newestBookings.map((booking) => (
              <div key={booking.id}>
                <strong>{booking.booking_reference ?? "No ref"} · {booking.full_name}</strong>
                <span>{formatDateOnly(booking.booking_date)} · {booking.booking_time} · {booking.simulator}</span>
              </div>
            ))}

            {newestBookings.length === 0 && <p>No upcoming bookings yet.</p>}
          </div>
        </article>

        <article className="admin-overview-panel">
          <div className="admin-overview-panel-header">
            <h3>Growth snapshot</h3>
            <span>{memberships.length} members</span>
          </div>

          <div className="admin-growth-grid">
            <div>
              <strong>{leads.length}</strong>
              <span>Total leads</span>
            </div>
            <div>
              <strong>{privateHires.length}</strong>
              <span>Private hire</span>
            </div>
            <div>
              <strong>{topMembershipInterest ? topMembershipInterest[1] : 0}</strong>
              <span>{topMembershipInterest ? topMembershipInterest[0] : "Top interest"}</span>
            </div>
          </div>

          <div className="admin-mini-list admin-mini-list-compact">
            {newestLeads.map((lead) => (
              <div key={lead.id}>
                <strong>{lead.full_name}</strong>
                <span>{lead.email}</span>
              </div>
            ))}

            {newestLeads.length === 0 && <p>No leads yet.</p>}
          </div>
        </article>
      </div>
    </div>
  );
}


function AdminBookings({ bookings, onChanged }: { bookings: Booking[]; onChanged: () => void }) {
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const haystack = [
        booking.booking_reference,
        booking.full_name,
        booking.email,
        booking.phone,
        booking.simulator,
        booking.booking_date,
        booking.booking_time,
        booking.booking_status,
        booking.payment_status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = haystack.includes(searchTerm.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" || (booking.booking_status ?? "pending") === statusFilter;
      const matchesDate = !dateFilter || booking.booking_date === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bookings, searchTerm, statusFilter, dateFilter]);

  const bookingCounts = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter((booking) => (booking.booking_status ?? "pending") === "pending").length,
      confirmed: bookings.filter((booking) => booking.booking_status === "confirmed").length,
      completed: bookings.filter((booking) => booking.booking_status === "completed").length,
      cancelled: bookings.filter((booking) => booking.booking_status === "cancelled").length
    };
  }, [bookings]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("");
  };

  const updateBookingStatus = async (bookingId: string, bookingStatus: string, paymentStatus?: string) => {
    setUpdatingId(bookingId);
    setMessage("Updating booking...");

    const updatePayload: Partial<Pick<Booking, "booking_status" | "payment_status">> = {
      booking_status: bookingStatus
    };

    if (paymentStatus) {
      updatePayload.payment_status = paymentStatus;
    }

    const { error } = await supabase
      .from("simulator_bookings")
      .update(updatePayload)
      .eq("id", bookingId);

    setUpdatingId("");

    if (error) {
      setMessage("Unable to update booking. Check Supabase update permissions.");
      return;
    }

    setMessage("Booking updated.");
    onChanged();
  };

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <h2>Simulator bookings</h2>
          {message && <p className="admin-inline-message">{message}</p>}
        </div>
        <button className="button button-primary" type="button" onClick={() => exportRows("tts-bookings.csv", filteredBookings)}>Export filtered CSV</button>
      </div>

      <div className="booking-admin-toolbar">
        <div className="booking-admin-search">
          <label>
            Search bookings
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Name, email, phone, ref or bay..."
            />
          </label>
        </div>

        <div className="booking-admin-filters">
          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses ({bookingCounts.all})</option>
              <option value="pending">Pending ({bookingCounts.pending})</option>
              <option value="confirmed">Confirmed ({bookingCounts.confirmed})</option>
              <option value="completed">Completed ({bookingCounts.completed})</option>
              <option value="cancelled">Cancelled ({bookingCounts.cancelled})</option>
            </select>
          </label>

          <label>
            Date
            <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
          </label>

          <button type="button" onClick={clearFilters}>Clear</button>
        </div>
      </div>

      <div className="booking-admin-summary">
        <span>{filteredBookings.length} showing</span>
        <span>{bookingCounts.pending} pending</span>
        <span>{bookingCounts.confirmed} confirmed</span>
        <span>{bookingCounts.completed} completed</span>
        <span>{bookingCounts.cancelled} cancelled</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Ref</th><th>Date</th><th>Time</th><th>Simulator</th><th>Name</th><th>Players</th><th>Deposit</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filteredBookings.map((booking) => {
              const currentStatus = booking.booking_status ?? "pending";
              const isUpdating = updatingId === booking.id;

              return (
                <tr key={booking.id}>
                  <td><strong>{booking.booking_reference ?? "-"}</strong></td>
                  <td>{formatDateOnly(booking.booking_date)}</td>
                  <td>{booking.booking_time} - {booking.booking_end_time ?? addMinutesToTime(booking.booking_time, booking.duration)}</td>
                  <td>{booking.simulator}</td>
                  <td>{booking.full_name}<br /><a href={`mailto:${booking.email}`}>{booking.email}</a><br />{booking.phone}</td>
                  <td>{booking.group_size}</td>
                  <td>£{booking.deposit_amount}</td>
                  <td>
                    <span className={`status-badge status-${currentStatus}`}>
                      {currentStatus}
                    </span>
                    <small>{booking.payment_status ?? "unpaid"}</small>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        disabled={isUpdating || currentStatus === "confirmed"}
                        onClick={() => updateBookingStatus(booking.id, "confirmed", "unpaid")}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating || currentStatus === "completed"}
                        onClick={() => updateBookingStatus(booking.id, "completed", "paid")}
                      >
                        Complete
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating || currentStatus === "cancelled"}
                        onClick={() => updateBookingStatus(booking.id, "cancelled")}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredBookings.length === 0 && (
              <tr>
                <td colSpan={9}>No bookings match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function AdminMemberships({ memberships, onChanged }: { memberships: Membership[]; onChanged: () => void }) {
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const membershipTypes = useMemo(() => {
    return Array.from(new Set(memberships.map((member) => member.membership_type).filter(Boolean))).sort();
  }, [memberships]);

  const filteredMemberships = useMemo(() => {
    return memberships.filter((member) => {
      const haystack = [
        member.full_name,
        member.email,
        member.phone,
        member.membership_type,
        member.status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = haystack.includes(searchTerm.trim().toLowerCase());
      const matchesType = typeFilter === "all" || member.membership_type === typeFilter;
      const matchesStatus = statusFilter === "all" || (member.status ?? "waiting") === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [memberships, searchTerm, typeFilter, statusFilter]);

  const membershipCounts = useMemo(() => {
    return {
      all: memberships.length,
      waiting: memberships.filter((member) => (member.status ?? "waiting") === "waiting").length,
      contacted: memberships.filter((member) => member.status === "contacted").length,
      priority: memberships.filter((member) => member.status === "priority").length,
      converted: memberships.filter((member) => member.status === "converted").length,
      declined: memberships.filter((member) => member.status === "declined").length
    };
  }, [memberships]);

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  const updateMembershipStatus = async (membershipId: string, status: string) => {
    setUpdatingId(membershipId);
    setMessage("Updating membership...");

    const { error } = await supabase
      .from("memberships")
      .update({ status })
      .eq("id", membershipId);

    setUpdatingId("");

    if (error) {
      setMessage("Unable to update membership. Check Supabase update permissions.");
      return;
    }

    setMessage("Membership updated.");
    onChanged();
  };

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <h2>Membership waiting list</h2>
          {message && <p className="admin-inline-message">{message}</p>}
        </div>
        <button className="button button-primary" type="button" onClick={() => exportRows("tts-memberships.csv", filteredMemberships)}>Export filtered CSV</button>
      </div>

      <div className="membership-admin-toolbar">
        <div className="membership-admin-search">
          <label>
            Search members
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Name, email, phone or membership type..."
            />
          </label>
        </div>

        <div className="membership-admin-filters">
          <label>
            Interest
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">All interests</option>
              {membershipTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>

          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses ({membershipCounts.all})</option>
              <option value="waiting">Waiting ({membershipCounts.waiting})</option>
              <option value="contacted">Contacted ({membershipCounts.contacted})</option>
              <option value="priority">Priority ({membershipCounts.priority})</option>
              <option value="converted">Converted ({membershipCounts.converted})</option>
              <option value="declined">Declined ({membershipCounts.declined})</option>
            </select>
          </label>

          <button type="button" onClick={clearFilters}>Clear</button>
        </div>
      </div>

      <div className="booking-admin-summary">
        <span>{filteredMemberships.length} showing</span>
        <span>{membershipCounts.waiting} waiting</span>
        <span>{membershipCounts.contacted} contacted</span>
        <span>{membershipCounts.priority} priority</span>
        <span>{membershipCounts.converted} converted</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Interest</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {filteredMemberships.map((member) => {
              const currentStatus = member.status ?? "waiting";
              const isUpdating = updatingId === member.id;

              return (
                <tr key={member.id}>
                  <td><strong>{member.full_name}</strong></td>
                  <td><a href={`mailto:${member.email}`}>{member.email}</a></td>
                  <td>{member.phone ?? "-"}</td>
                  <td>{member.membership_type}</td>
                  <td>
                    <span className={`status-badge status-${currentStatus}`}>
                      {currentStatus}
                    </span>
                  </td>
                  <td>{formatDate(member.created_at)}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        disabled={isUpdating || currentStatus === "contacted"}
                        onClick={() => updateMembershipStatus(member.id, "contacted")}
                      >
                        Contacted
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating || currentStatus === "priority"}
                        onClick={() => updateMembershipStatus(member.id, "priority")}
                      >
                        Priority
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating || currentStatus === "converted"}
                        onClick={() => updateMembershipStatus(member.id, "converted")}
                      >
                        Converted
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating || currentStatus === "declined"}
                        onClick={() => updateMembershipStatus(member.id, "declined")}
                      >
                        Declined
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredMemberships.length === 0 && (
              <tr>
                <td colSpan={7}>No memberships match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function AdminPrivateHires({ privateHires }: { privateHires: PrivateHire[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState("all");

  const eventTypes = useMemo(() => {
    return Array.from(new Set(privateHires.map((hire) => hire.event_type).filter(Boolean) as string[])).sort();
  }, [privateHires]);

  const filteredPrivateHires = useMemo(() => {
    return privateHires.filter((hire) => {
      const haystack = [
        hire.full_name,
        hire.email,
        hire.phone,
        hire.event_type,
        hire.preferred_date,
        hire.guest_count,
        hire.message
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = haystack.includes(searchTerm.trim().toLowerCase());
      const matchesEvent = eventFilter === "all" || hire.event_type === eventFilter;

      return matchesSearch && matchesEvent;
    });
  }, [privateHires, searchTerm, eventFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setEventFilter("all");
  };

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <h2>Private hire enquiries</h2>
          <p className="admin-inline-message">{filteredPrivateHires.length} showing from {privateHires.length} enquiries.</p>
        </div>
        <button className="button button-primary" type="button" onClick={() => exportRows("tts-private-hire.csv", filteredPrivateHires)}>Export filtered CSV</button>
      </div>

      <div className="private-admin-toolbar">
        <div className="private-admin-search">
          <label>
            Search private hire
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Name, email, event type or message..."
            />
          </label>
        </div>

        <div className="private-admin-filters">
          <label>
            Event type
            <select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}>
              <option value="all">All event types</option>
              {eventTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>

          <button type="button" onClick={clearFilters}>Clear</button>
        </div>
      </div>

      <div className="private-hire-admin-grid">
        {filteredPrivateHires.map((hire) => (
          <article className="private-hire-admin-card" key={hire.id}>
            <div className="private-hire-admin-card-header">
              <div>
                <span>{hire.event_type || "Private hire"}</span>
                <h3>{hire.full_name}</h3>
              </div>
              <strong>{formatDate(hire.created_at)}</strong>
            </div>

            <div className="private-hire-admin-meta">
              <p><strong>Email</strong><a href={`mailto:${hire.email}`}>{hire.email}</a></p>
              <p><strong>Phone</strong>{hire.phone || "-"}</p>
              <p><strong>Preferred date</strong>{hire.preferred_date || "-"}</p>
              <p><strong>Guests</strong>{hire.guest_count || "-"}</p>
            </div>

            {hire.message && (
              <div className="private-hire-admin-message">
                <strong>Message</strong>
                <p>{hire.message}</p>
              </div>
            )}

            <div className="private-hire-admin-actions">
              <a className="button button-primary" href={`mailto:${hire.email}?subject=Tee Time Social private hire enquiry`}>Email</a>
              {hire.phone && <a className="button button-secondary" href={`tel:${hire.phone}`}>Call</a>}
            </div>
          </article>
        ))}

        {filteredPrivateHires.length === 0 && (
          <div className="admin-empty-state">
            <h3>No private hire enquiries match the current filters.</h3>
            <p>Clear the filters to view all enquiries.</p>
          </div>
        )}
      </div>
    </div>
  );
}


function AdminLeads({ leads }: { leads: Lead[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [interestFilter, setInterestFilter] = useState("all");

  const interestOptions = useMemo(() => {
    const allInterests = leads.flatMap((lead) => lead.interests ?? []);
    return Array.from(new Set(allInterests.filter(Boolean))).sort();
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const interests = lead.interests ?? [];
      const haystack = [
        lead.full_name,
        lead.email,
        lead.phone,
        lead.message,
        lead.source,
        ...interests
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = haystack.includes(searchTerm.trim().toLowerCase());
      const matchesInterest = interestFilter === "all" || interests.includes(interestFilter);

      return matchesSearch && matchesInterest;
    });
  }, [leads, searchTerm, interestFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setInterestFilter("all");
  };

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <h2>Lead registrations</h2>
          <p className="admin-inline-message">{filteredLeads.length} showing from {leads.length} leads.</p>
        </div>
        <button className="button button-primary" type="button" onClick={() => exportRows("tts-leads.csv", filteredLeads)}>Export filtered CSV</button>
      </div>

      <div className="leads-admin-toolbar">
        <div className="leads-admin-search">
          <label>
            Search leads
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Name, email, phone, interest or message..."
            />
          </label>
        </div>

        <div className="leads-admin-filters">
          <label>
            Interest
            <select value={interestFilter} onChange={(event) => setInterestFilter(event.target.value)}>
              <option value="all">All interests</option>
              {interestOptions.map((interest) => <option key={interest} value={interest}>{interest}</option>)}
            </select>
          </label>

          <button type="button" onClick={clearFilters}>Clear</button>
        </div>
      </div>

      <div className="leads-admin-grid">
        {filteredLeads.map((lead) => (
          <article className="lead-admin-card" key={lead.id}>
            <div className="lead-admin-card-header">
              <div>
                <span>{lead.source || "Website lead"}</span>
                <h3>{lead.full_name}</h3>
              </div>
              <strong>{formatDate(lead.created_at)}</strong>
            </div>

            <div className="lead-admin-meta">
              <p><strong>Email</strong><a href={`mailto:${lead.email}`}>{lead.email}</a></p>
              <p><strong>Phone</strong>{lead.phone || "-"}</p>
            </div>

            {(lead.interests ?? []).length > 0 && (
              <div className="lead-interest-list">
                {(lead.interests ?? []).map((interest) => <span key={interest}>{interest}</span>)}
              </div>
            )}

            {lead.message && (
              <div className="lead-admin-message">
                <strong>Message</strong>
                <p>{lead.message}</p>
              </div>
            )}

            <div className="lead-admin-actions">
              <a className="button button-primary" href={`mailto:${lead.email}?subject=Tee Time Social enquiry`}>Email</a>
              {lead.phone && <a className="button button-secondary" href={`tel:${lead.phone}`}>Call</a>}
            </div>
          </article>
        ))}

        {filteredLeads.length === 0 && (
          <div className="admin-empty-state">
            <h3>No leads match the current filters.</h3>
            <p>Clear the filters to view all lead registrations.</p>
          </div>
        )}
      </div>
    </div>
  );
}


function exportRows(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export default App;
