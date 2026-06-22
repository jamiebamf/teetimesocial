import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabase";

const interestOptions = [
  "Simulator Bookings",
  "Memberships",
  "Lessons & Coaching",
  "Golf Leagues",
  "Events",
  "Private Hire",
  "Giveaways",
  "Professional Shop Offers"
];

export default function RegisterForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const selectedCount = useMemo(() => selectedInterests.length, [selectedInterests]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest]
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");

    const { error } = await supabase.from("leads").insert({
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      interests: selectedInterests,
      message: message.trim(),
      source: "coming_soon_page"
    });

    if (error) {
      console.error(error);
      setStatus("error");
      return;
    }

    setFullName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setSelectedInterests([]);
    setStatus("success");
  };

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <label>
        Full name
        <input
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
      </label>

      <label>
        Email address
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label>
        Mobile number
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </label>

      <div className="interest-panel">
        <p>I&apos;m interested in {selectedCount > 0 ? `(${selectedCount})` : ""}</p>

        <div className="interest-grid">
          {interestOptions.map((interest) => (
            <button
              key={interest}
              type="button"
              className={selectedInterests.includes(interest) ? "interest active" : "interest"}
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      <label>
        Anything else?
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
        />
      </label>

      <button className="button button-primary form-button" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Submitting..." : "Register Interest"}
      </button>

      {status === "success" && <p className="form-success">Thank you. Your interest has been registered.</p>}
      {status === "error" && <p className="form-error">Something went wrong. Please try again.</p>}
    </form>
  );
}
