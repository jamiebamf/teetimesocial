import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import RegisterForm from "../components/RegisterForm";

export default function Home() {
  return (
    <main>
      <Navbar />

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
              <a href="#register" className="button button-primary">Register Interest</a>
              <a href="#simulators" className="button button-secondary">Explore Simulators</a>
            </div>
          </div>

          <div className="hero-card">
            <div className="status-pill"><span></span>Coming soon</div>
            <h2>Register before launch</h2>
            <p>Be first to hear about opening dates, simulator bookings, memberships, giveaways, leagues and pro shop offers.</p>
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
            <h2>Built for golfers, groups, coaching and social play.</h2>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <span className="feature-number">01</span>
              <h3>4 x Golfzon TwoVision</h3>
              <p>Premium simulator bays designed for realistic indoor golf, practice, challenges, social groups and future online booking.</p>
            </article>

            <article className="feature-card">
              <span className="feature-number">02</span>
              <h3>1 x Golfzon GDR Max</h3>
              <p>A dedicated coaching and performance space for lessons, swing data, practice sessions and professional improvement.</p>
            </article>

            <article className="feature-card">
              <span className="feature-number">03</span>
              <h3>Club hire available</h3>
              <p>Guests will be encouraged to bring their own clubs, with hire sets planned for players who need them.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="experience" className="section section-light">
        <div className="container split">
          <div>
            <p className="eyebrow">The experience</p>
            <h2>Golf, live sport, food, drink and events under one roof.</h2>
          </div>

          <div className="experience-list">
            <div><h3>Indoor Golf</h3><p>Book simulator bays for practice, casual play, groups and leagues.</p></div>
            <div><h3>Pro Shop & Coaching</h3><p>Lessons, coaching packages, golf leagues and professional shop offers.</p></div>
            <div><h3>Events & Private Hire</h3><p>Bottomless brunch, live sport, corporate nights and private bookings.</p></div>
          </div>
        </div>
      </section>

      <section id="events" className="section section-events">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Events coming soon</p>
            <h2>More than golf.</h2>
            <p>Tee Time Social will be built for birthdays, socials, live sport, corporate nights, competitions, leagues and private hire.</p>
          </div>

          <div className="event-tags">
            <span>Bottomless Brunch</span>
            <span>Live Sport</span>
            <span>Golf Leagues</span>
            <span>Corporate Hire</span>
            <span>Private Events</span>
            <span>Giveaways</span>
          </div>
        </div>
      </section>

      <section id="register" className="section register-section">
        <div className="container register-grid">
          <div>
            <p className="eyebrow">Register your interest</p>
            <h2>Join the Tee Time Social launch list.</h2>
            <p>Register now for early updates, opening information, booking alerts, membership news, event announcements and launch offers.</p>
            <div className="benefits">
              <span>Early booking access</span>
              <span>Launch offers</span>
              <span>Giveaway entries</span>
              <span>Membership updates</span>
            </div>
          </div>

          <RegisterForm />
        </div>
      </section>

      <section id="location" className="section location-section">
        <div className="container location-card">
          <div>
            <p className="eyebrow">Find us</p>
            <h2>Regent Street, Barnsley</h2>
            <p>Tee Time Social<br />Regent Street<br />Barnsley<br />S70 2HJ</p>
          </div>

          <div>
            <h3>Contact</h3>
            <p>Email: info@teetimesocial.co.uk<br />Phone: TBC<br />Opening times: TBC</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
