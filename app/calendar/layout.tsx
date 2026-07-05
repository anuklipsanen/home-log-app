export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      style={{
        width: "100%",
        padding: "16px 12px",
        overflowX: "auto",
      }}
    >
      {children}
    </main>
  );
}