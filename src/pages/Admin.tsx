import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Lead } from "../lib/supabase";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function Admin() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const loadLeads = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setError("Unable to load leads. Check Supabase permissions.");
      setLoading(false);
      return;
    }

    setLeads(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    const search = query.toLowerCase().trim();
    if (!search) return leads;

    return leads.filter((lead) => {
      const searchable = [
        lead.full_name,
        lead.email,
        lead.phone ?? "",
        lead.message ?? "",
        ...(lead.interests ?? [])
      ].join(" ").toLowerCase();

      return searchable.includes(search);
    });
  }, [leads, query]);

  const interestCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    leads.forEach((lead) => {
      (lead.interests ?? []).forEach((interest) => {
        counts[interest] = (counts[interest] ?? 0) + 1;
      });
    });

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  const topInterest = interestCounts[0]?.[0] ?? "None yet";

  const exportCsv = () => {
    const header = ["Name", "Email", "Phone", "Interests", "Message", "Date"];
    const rows = filteredLeads.map((lead) => [
      lead.full_name,
      lead.email,
      lead.phone ?? "",
      (lead.interests ?? []).join("; "),
      lead.message ?? "",
      formatDate(lead.created_at)
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => csvEscape(value)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tee-time-social-leads.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="admin-page">
      <div className="admin-topbar">
        <a href="/">← Back to website</a>
      </div>

      <section className="admin-hero">
        <div className="container admin-hero-grid">
          <div>
            <p className="eyebrow">Tee Time Social Admin</p>
            <h1>Lead dashboard</h1>
            <p>View launch registrations, track interest and export customer data.</p>
          </div>

          <div className="admin-actions">
            <button className="button button-secondary" onClick={loadLeads} disabled={loading}>Refresh</button>
            <button className="button button-primary" onClick={exportCsv}>Export CSV</button>
          </div>
        </div>
      </section>

      <section className="admin-content">
        <div className="container">
          <div className="admin-stats">
            <div><span>Total leads</span><strong>{leads.length}</strong></div>
            <div><span>Filtered</span><strong>{filteredLeads.length}</strong></div>
            <div><span>Top interest</span><strong>{topInterest}</strong></div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <h2>Registrations</h2>
                <p>Latest people who have registered interest.</p>
              </div>

              <input
                className="admin-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search leads..."
              />
            </div>

            {error && <p className="form-error">{error}</p>}
            {loading && <p className="admin-empty">Loading leads...</p>}

            {!loading && filteredLeads.length === 0 && (
              <p className="admin-empty">No leads found.</p>
            )}

            {!loading && filteredLeads.length > 0 && (
              <div className="lead-table-wrap">
                <table className="lead-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Interests</th>
                      <th>Message</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td>{lead.full_name}</td>
                        <td>{lead.email}</td>
                        <td>{lead.phone || "—"}</td>
                        <td>
                          <div className="mini-tags">
                            {(lead.interests ?? []).map((interest) => <span key={interest}>{interest}</span>)}
                          </div>
                        </td>
                        <td>{lead.message || "—"}</td>
                        <td>{formatDate(lead.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="admin-panel interest-panel-admin">
            <h2>Interest breakdown</h2>
            {interestCounts.length === 0 ? (
              <p className="admin-empty">No interests selected yet.</p>
            ) : (
              <div className="interest-bars">
                {interestCounts.map(([interest, count]) => (
                  <div className="interest-bar" key={interest}>
                    <div className="interest-bar-label">
                      <span>{interest}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="bar-track">
                      <span style={{ width: `${Math.max(8, (count / leads.length) * 100)}%` }}></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
