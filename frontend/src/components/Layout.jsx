// Layout is now a passthrough — AppShell handles the mobile chrome.
// Kept for backwards compatibility with any remaining references.
export default function Layout({ children }) {
  return <>{children}</>;
}
