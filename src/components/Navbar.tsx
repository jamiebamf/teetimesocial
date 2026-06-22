export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <a href="/" className="brand" aria-label="Tee Time Social home">
          <span className="brand-mark">TTS</span>
          <span>Tee Time Social</span>
        </a>

        <div className="nav-links">
          <a href="/#simulators">Simulators</a>
          <a href="/#experience">Experience</a>
          <a href="/#events">Events</a>
          <a href="/#location">Location</a>
          <a href="/#register" className="nav-button">Register Interest</a>
        </div>
      </div>
    </nav>
  );
}
