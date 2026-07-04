export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#181818",
        border: "1px solid #2a2a2a",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        transition: "0.2s",
        marginBottom: 12,
}}
onMouseEnter={(e) => {
  e.currentTarget.style.transform = "scale(1.02)";
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {children}
    </div>
  );
}

