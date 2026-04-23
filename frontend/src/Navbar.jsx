import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import LoginModel from './Login';
import SignupModel from './Signup';

const categoryItems = [
  { label: 'Instruksi Kerja QC', to: '/categories/instruksi-kerja-qc' },
  { label: 'List IK dan Form', to: '/categories/list-ik-dan-form' },
  { label: 'Prosedur QC', to: '/categories/prosedur-qc' },
  { label: 'Spesifikasi Produk', to: '/categories/spesifikasi-produk' },
];

function NavbarComponent() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // New state for dropdown
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem('qcpedia-user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('qcpedia-user');
      }
    }
  }, []);

  const openLogin = () => {
    setIsSignupOpen(false);
    setIsLoginOpen(true);
  };

  const openSignup = () => {
    setIsLoginOpen(false);
    setIsSignupOpen(true);
  };

  const linkClassName = (isActive) =>
    `transition ${isActive ? 'text-red-700' : 'text-slate-700 hover:text-red-700'}`;

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('qcpedia-user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('qcpedia-user');
    setIsMenuOpen(false);
  };

  const renderUserBadge = (isMobile = false) => (
    <div
      className={`rounded-2xl border border-red-200 bg-red-50 px-4 py-1 text-left ${
        isMobile ? 'w-full' : ''
      }`}
    >
      <p className="mt-1 text-sm font-semibold text-slate-900">{currentUser?.nama ?? currentUser?.username}</p>
      <p className="text-xs text-slate-600">{currentUser?.email}</p>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-red-100/80 bg-white/90 backdrop-blur">
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
                  className="flex items-center gap-2 text-slate-700 hover:text-red-700 transition"
                >
                  Kategori
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isDropdownOpen && (
                  <div className="animate-fade-up absolute top-full z-10 mt-2 w-48 rounded-lg border border-red-100 bg-white shadow-lg">
                    {categoryItems.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700"
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

            {currentUser ? (
              <div className="flex items-center gap-3">
                {renderUserBadge()}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={openLogin}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={openSignup}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Signup
                </button>
              </>
            )}
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
              {currentUser ? (
                <>
                  {renderUserBadge(true)}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      openLogin();
                    }}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      openSignup();
                    }}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    Signup
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {isLoginOpen && (
        <LoginModel
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onOpenSignup={openSignup}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
      {isSignupOpen && (
        <SignupModel
          isOpen={isSignupOpen}
          onClose={() => setIsSignupOpen(false)}
          onOpenLogin={openLogin}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </>
  );
}

export default NavbarComponent;
