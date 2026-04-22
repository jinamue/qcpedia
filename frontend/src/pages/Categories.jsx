function Categories() {
  const categories = [
    {
      id: 1,
      name: 'Instruksi Kerja QC',
      count: 25,
      description: 'Panduan kerja terstruktur untuk membantu tim menjalankan proses QC secara konsisten.',
    },
    {
      id: 2,
      name: 'List IK dan Form',
      count: 18,
      description: 'Kumpulan formulir, checklist, dan dokumen pendukung yang siap digunakan di lapangan.',
    },
    {
      id: 3,
      name: 'Prosedur QC',
      count: 32,
      description: 'Alur pemeriksaan mutu dari awal sampai akhir agar proses tetap terdokumentasi dengan baik.',
    },
    {
      id: 4,
      name: 'Spesifikasi Produk',
      count: 15,
      description: 'Referensi spesifikasi bahan dan produk untuk memastikan standar mutu tetap terjaga.',
    },
  ];

  return (
    <main className="bg-slate-50">
      <section className="container mx-auto px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700">
              Kategori Dokumentasi
            </span>
            <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
              Temukan dokumen QC berdasarkan kebutuhan tim
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Semua kategori disusun agar pencarian instruksi kerja, prosedur, formulir, dan spesifikasi
              produk jadi lebih cepat saat dibutuhkan di operasional harian.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <article
                key={category.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">{category.name}</h2>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-blue-700">
                    {category.count}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{category.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default Categories;
