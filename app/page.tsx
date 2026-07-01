import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1>🏠 Home Log</h1>

      <p style={{ marginBottom: 24 }}>
        Kodin huoltojen, dokumenttien ja muistutusten hallinta yhdessä paikassa.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <Link href="/upload" style={cardStyle}>
          <h2>📤 Upload</h2>
          <p>Lataa lasku, kuitti tai dokumentti ja anna AI:n tulkita tiedot.</p>
        </Link>

        <Link href="/events" style={cardStyle}>
          <h2>📋 Tapahtumat</h2>
          <p>Selaa ja muokkaa tallennettuja huoltoja ja tapahtumia.</p>
        </Link>

        <Link href="/calendar" style={cardStyle}>
          <h2>📅 Kalenteri</h2>
          <p>Näe tapahtumat ja muistutukset kalenterinäkymässä.</p>
        </Link>
      </div>

      <section style={summaryStyle}>
        <h2>Yhteenveto</h2>
        <p>
          Aloita lataamalla uusi dokumentti tai siirry tarkastelemaan jo
          tallennettuja tapahtumia.
        </p>
      </section>
    </main>
  );
}

const cardStyle = {
  display: "block",
  padding: 18,
  border: "1px solid #333",
  borderRadius: 12,
  textDecoration: "none",
  color: "inherit",
  background: "#111",
};

const summaryStyle = {
  padding: 18,
  border: "1px solid #333",
  borderRadius: 12,
  background: "#111",
};