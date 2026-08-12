import Nav from './Nav.jsx';

export default function Layout({ children }) {
  return (
    <div id="top" className="relative min-h-screen text-[var(--color-fg)]">
      <Nav />
      <main className="relative z-10">{children}</main>
    </div>
  );
}
