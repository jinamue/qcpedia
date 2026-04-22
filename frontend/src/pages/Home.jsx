import { Link } from 'react-router-dom';
import heroBanner from '../assets/herobanner.jpeg';

function Home() {
  return (
    <main className="bg-slate-50">
      <section className="container mx-auto px-4 py-8">
        <div
          className="hero-banner hero-banner-soft min-h-[calc(100vh-8rem)] rounded-2xl border border-slate-200 shadow-lg"
          style={{ '--hero-image': `url(${heroBanner})` }}
        >
          <div className="flex min-h-[calc(100vh-8rem)] items-center px-6 py-16 sm:px-10 lg:px-14 lg:py-24">
            <div className="text-left text-white">
              <span className="mb-4 inline-flex rounded-full border border-white/30 bg-white/15 px-4 py-1 text-sm font-medium text-white backdrop-blur-sm">
                Pusat Dokumentasi Quality Control
              </span>

              <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                Selamat Datang di QCPedia
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-100 md:text-lg">
                Temukan instruksi kerja QC, daftar IK dan form, prosedur QC, hingga spesifikasi produk
                dalam satu halaman yang lebih mudah dijelajahi tim.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/categories"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Jelajahi Kategori
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/15 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
                >
                  Hubungi Kami
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Home;
