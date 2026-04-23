import { Link } from 'react-router-dom';

const categories = [
  {
    id: 'instruksi-kerja-qc',
    name: 'Instruksi Kerja QC',
    description: 'Panduan kerja terstruktur untuk membantu tim menjalankan proses QC secara konsisten.',
    to: '/categories/instruksi-kerja-qc',
  },
  {
    id: 'list-ik-dan-form',
    name: 'List IK dan Form',
    description: 'Kumpulan formulir, checklist, dan dokumen pendukung yang siap digunakan di lapangan.',
    to: '/categories/list-ik-dan-form',
  },
  {
    id: 'prosedur-qc',
    name: 'Prosedur QC',
    description: 'Alur pemeriksaan mutu dari awal sampai akhir agar proses tetap terdokumentasi dengan baik.',
    to: '/categories/prosedur-qc',
  },
  {
    id: 'spesifikasi-produk',
    name: 'Spesifikasi Produk',
    description: 'Referensi spesifikasi bahan dan produk untuk memastikan standar mutu tetap terjaga.',
    to: '/categories/spesifikasi-produk',
  },
];

function Categories() {
  return (
    <main className="bg-slate-50">
      <section className="container mx-auto px-4 py-8">
        <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="max-w-3xl animate-fade-up">
            <span className="inline-flex rounded-full bg-red-50 px-4 py-1 text-sm font-medium text-red-700">
              Kategori Dokumentasi
            </span>
            <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
              Pilih kategori dokumen QC
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Setiap kategori sekarang dipisah ke halaman masing-masing supaya lebih rapi dan mudah
              dinavigasi.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={category.to}
                className="animate-fade-up rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/70 p-6 transition hover:-translate-y-1 hover:border-red-300 hover:shadow-md"
              >
                <h2 className="text-xl font-semibold text-slate-900">{category.name}</h2>
                <p className="mt-4 text-sm leading-6 text-slate-600">{category.description}</p>
                <p className="mt-5 text-sm font-semibold text-red-700">Buka kategori</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default Categories;
