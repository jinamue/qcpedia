function Contact() {
  return (
    <main className="bg-slate-50">
      <section className="container mx-auto px-4 py-8">
        <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="animate-fade-up rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/70 p-6">
              <span className="inline-flex rounded-full bg-red-50 px-4 py-1 text-sm font-medium text-red-700">
                Kontak
              </span>
              <h1 className="mt-4 text-3xl font-bold text-slate-900">Hubungi tim QCPedia</h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Gunakan halaman ini untuk menyampaikan pertanyaan, permintaan pembaruan dokumen, atau
                kebutuhan dukungan terkait sistem dokumentasi QC.
              </p>

              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-800">Email</p>
                  <p>
                    adminqc.rtm@cp.co.id
                    <br />
                    putri.harnis@cp.co.id
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Lokasi</p>
                  <p>PT. Charoen Pokphand Indonesia, Cikande</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Jam Operasional</p>
                  <p>Senin - Sabtu, 08.00 - 17.00 WIB</p>
                </div>
              </div>
            </div>

            <form className="animate-fade-up-delay grid gap-5">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                  Nama
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Masukkan nama Anda"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-slate-700">
                  Pesan
                </label>
                <textarea
                  id="message"
                  placeholder="Tulis kebutuhan atau pertanyaan Anda di sini"
                  rows={6}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-fit items-center justify-center rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Kirim Pesan
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Contact;
