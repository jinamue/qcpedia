function About() {
  return (
    <main className="bg-slate-50">
      <section className="container mx-auto px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <span className="inline-flex rounded-full bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700">
                Tentang QCPedia
              </span>
              <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
                Platform dokumentasi internal untuk mendukung proses quality control
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                QCPedia dirancang sebagai pusat informasi yang memudahkan tim dalam mengakses instruksi
                kerja, prosedur mutu, form pendukung, dan spesifikasi produk dalam satu tempat.
              </p>
              <p className="mt-4 text-base leading-7 text-slate-600">
                PT. Charoen Pokphand Indonesia Tbk. merupakan perusahaan agribisnis yang telah berkembang
                luas di Indonesia. Dengan dokumentasi yang tertata, proses operasional dapat berjalan lebih
                konsisten, cepat, dan mudah ditelusuri oleh seluruh tim terkait.
              </p>
            </div>

            <aside className="rounded-2xl bg-slate-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">Informasi Perusahaan</h2>
              <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
                <div>
                  <p className="font-semibold text-slate-800">Nama</p>
                  <p>PT. Charoen Pokphand Indonesia</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Alamat</p>
                  <p>
                    Kawasan Modern Industrial Estate, Jl. Raya Modern Industri II No. 15, Nambo Ilir,
                    Kec. Cikande, Kabupaten Serang, Banten 42186
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Fokus</p>
                  <p>Dokumentasi mutu, standar operasional, dan referensi internal quality control.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}

export default About;
