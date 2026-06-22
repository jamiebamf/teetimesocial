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

      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <h3>Tee Time Social</h3>
            <p>Barnsley&apos;s premium indoor golf and social venue.</p>
          </div>

          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms</a>
            <a href="/cookies">Cookies</a>
            <a href="/contact">Contact</a>
          </div>

          <p>© {new Date().getFullYear()} Tee Time Social. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}


function App() {
  const path = window.location.pathname;

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

  if (path === "/tts-admin") {
    return <ProtectedAdminPage />;
  }

  return <HomePage />;
}

function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
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

        <div className={`nav-links ${menuOpen ? "nav-links-open" : ""}`}>
          <a href="/#simulators" onClick={closeMenu}>Simulators</a>
          <a href="/coaching" onClick={closeMenu}>Coaching</a>
          <a href="/book-simulator" onClick={closeMenu}>Book Simulator</a>
          <a href="/memberships" onClick={closeMenu}>Memberships</a>
          <a href="/events" onClick={closeMenu}>Events</a>
          <a href="/contact" onClick={closeMenu}>Contact</a>
          <a href="/#register" className="nav-button" onClick={closeMenu}>Register</a>
        </div>
      </div>
    </nav>
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

      <section className="page-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Book simulator</p>
            <h1>Reserve your indoor golf bay.</h1>
            <p>Choose your date, simulator, session length and group size. This V1 booking system captures requests and prevents double bookings.</p>
          </div>

          <div className="booking-summary-card">
            <span>Deposit due later</span>
            <strong>£{depositAmount}</strong>
            <p>Generic V1 deposit is calculated at £{DEPOSIT_PER_PLAYER} per player. Online payment will be added later.</p>
          </div>
        </div>
      </section>

      <section className="section booking-section">
        <div className="container booking-grid">
          <div className="booking-info-panel">
            <p className="eyebrow">Availability</p>
            <h2>Pick a bay and time.</h2>
            <p className="booking-help">Booked slots are disabled automatically for the selected simulator and date.</p>
            <ul>
              <li>Maximum {MAX_PLAYERS} players per bay</li>
              <li>30, 60 or 90 minute sessions</li>
              <li>Bring your own clubs or request hire</li>
              <li>Children must be accompanied by an adult</li>
            </ul>
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
