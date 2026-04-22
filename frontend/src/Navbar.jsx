import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import LoginModel from './Login';

const categoryItems = [
  { label: 'Instruksi Kerja QC', to: '/categories?type=instruksi-kerja-qc' },
  { label: 'List IK dan Form', to: '/categories?type=list-ik-dan-form' },
  { label: 'Prosedur QC', to: '/categories?type=prosedur-qc' },
  { label: 'Spesifikasi Produk', to: '/categories?type=spesifikasi-produk' },
];

function NavbarComponent() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // New state for dropdown
  const location = useLocation();

  const linkClassName = (isActive) =>
    `transition ${isActive ? 'text-blue-700' : 'text-slate-700 hover:text-blue-700'}`;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logoqcpedia.png" className="h-8 w-auto sm:h-9" alt="QCPedia Logo" />
          </Link>

          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 md:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            Menu
          </button>

          <div className="hidden items-center gap-8 md:flex">
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link to="/" className={linkClassName(location.pathname === '/')}>
                Home
              </Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((open) => !open)}
                  className="flex items-center gap-2 text-slate-700 hover:text-blue-700 transition"
                >
                  Kategori
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                    {categoryItems.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-blue-700"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/about" className={linkClassName(location.pathname === '/about')}>
                Tentang QCPedia
              </Link>
              <Link to="/contact" className={linkClassName(location.pathname === '/contact')}>
                Kontak
              </Link>
            </nav>

            <button
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Login
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-4 text-sm font-medium">
              <Link to="/" className={linkClassName(location.pathname === '/')} onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
              <div className="flex flex-col gap-2">
                <span className="text-slate-500">Kategori:</span>
                {categoryItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={linkClassName(location.pathname === '/categories')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <Link to="/about" className={linkClassName(location.pathname === '/about')} onClick={() => setIsMenuOpen(false)}>
                Tentang QCPedia
              </Link>
              <Link to="/contact" className={linkClassName(location.pathname === '/contact')} onClick={() => setIsMenuOpen(false)}>
                Kontak
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsLoginOpen(true);
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </header>

      {isLoginOpen && <LoginModel isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />}
    </>
  );
}

export default NavbarComponent;