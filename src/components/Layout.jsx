import Nav from './Nav.jsx';
import AuroraBackground from './AuroraBackground.jsx';

export default function Layout({ children }) {
  return (
    <div id="top" className="relative min-h-screen text-[var(--color-fg)]">
      <AuroraBackground />
      <Nav />
      <main className="relative z-10">{children}</main>
    </div>
  );
}
