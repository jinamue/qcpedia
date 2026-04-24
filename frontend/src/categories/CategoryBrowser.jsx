import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import {
  getStoredToken,
  getStoredUser,
  isAdminUser,
  subscribeToSessionChange,
} from '../config/auth';

const pageSizeOptions = [10, 25, 50];

function FolderIcon({ active }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${active ? 'text-white' : 'text-red-600'}`}
      fill="currentColor"
    >
      <path d="M10 4a2 2 0 0 1 1.414.586L13.828 7H19a2 2 0 0 1 2 2v1H3V7a2 2 0 0 1 2-2h5Z" />
      <path d="M3 11h18v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-6Z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
      <path d="M7 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9.414A2 2 0 0 0 18.414 8L14 3.586A2 2 0 0 0 12.586 3H7Z" />
      <path d="M14 3.5V8a1 1 0 0 0 1 1h4.5" className="text-red-300" />
      <path d="M8 12h8v1.5H8zm0 3h8v1.5H8z" className="text-red-300" />
    </svg>
  );
}

function CategoryBrowser({ categoryLabel }) {
  const [categoryData, setCategoryData] = useState(null);
  const [activeSubCategory, setActiveSubCategory] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPage, setSelectedPage] = useState(null);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [protectionNotice, setProtectionNotice] = useState('');
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [accessToken, setAccessToken] = useState(() => getStoredToken());
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ page_name: '', content: '' });
  const [editFeedback, setEditFeedback] = useState({ type: '', message: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const isAuthenticatedAdmin = isAdminUser(currentUser) && Boolean(accessToken);

  useEffect(() => {
    const syncSession = () => {
      setCurrentUser(getStoredUser());
      setAccessToken(getStoredToken());
    };

    return subscribeToSessionChange(syncSession);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCategoryData() {
      setIsLoading(true);
      setError('');
      setCategoryData(null);
      setSelectedPage(null);
      setPageError('');

      try {
        const response = await fetch(
          `${API_BASE_URL}/categories?category=${encodeURIComponent(categoryLabel)}`,
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.detail || 'Data kategori tidak bisa dimuat.');
        }

        if (!isMounted) {
          return;
        }

        setCategoryData(payload);
        setActiveSubCategory(payload.sub_categories[0]?.uuid ?? null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : 'Terjadi kesalahan saat memuat kategori.',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCategoryData();

    return () => {
      isMounted = false;
    };
  }, [categoryLabel]);

  const activeSubCategoryData = useMemo(
    () =>
      categoryData?.sub_categories.find((subCategory) => subCategory.uuid === activeSubCategory) ?? null,
    [activeSubCategory, categoryData],
  );

  const filteredPages = useMemo(() => {
    const pages = activeSubCategoryData?.pages ?? [];
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return pages;
    }

    return pages.filter((page) => page.name.toLowerCase().includes(normalizedSearchTerm));
  }, [activeSubCategoryData, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSubCategory, pageSize, searchTerm]);

  useEffect(() => {
    if (!selectedPage) {
      return undefined;
    }

    const handleProtectedShortcut = (event) => {
      const pressedKey = event.key.toLowerCase();
      const isBlockedShortcut =
        (event.ctrlKey || event.metaKey) && ['c', 'x', 'p', 's', 'u'].includes(pressedKey);
      const isPrintScreen = event.key === 'PrintScreen';

      if (!isBlockedShortcut && !isPrintScreen) {
        return;
      }

      event.preventDefault();
      setProtectionNotice('Proteksi dokumen aktif. Copy, print, dan screenshot dibatasi pada halaman ini.');
    };

    window.addEventListener('keydown', handleProtectedShortcut);

    return () => {
      window.removeEventListener('keydown', handleProtectedShortcut);
    };
  }, [selectedPage]);

  useEffect(() => {
    if (!protectionNotice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setProtectionNotice(''), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [protectionNotice]);

  const totalEntries = filteredPages.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = totalEntries === 0 ? 0 : (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);

  const visiblePages = useMemo(
    () => filteredPages.slice(startIndex, endIndex),
    [endIndex, filteredPages, startIndex],
  );

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages],
  );

  const handleOpenFile = async (page) => {
    setIsPageLoading(true);
    setPageError('');
    setSelectedPage(null);
    setIsEditMode(false);
    setEditFeedback({ type: '', message: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/pages/${page.uuid}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.detail || 'Konten file tidak bisa dimuat.');
      }

      setSelectedPage(payload);
      setEditForm({
        page_name: payload.name ?? '',
        content: payload.content ?? '',
      });
    } catch (loadError) {
      setPageError(loadError instanceof Error ? loadError.message : 'Konten file tidak bisa dimuat.');
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedPage) {
      return;
    }

    setIsSavingEdit(true);
    setEditFeedback({ type: '', message: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/admin/pages/${selectedPage.uuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(editForm),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.detail || 'Perubahan isi kategori gagal disimpan.');
      }

      setSelectedPage(payload.page);
      setEditForm({
        page_name: payload.page.name ?? '',
        content: payload.page.content ?? '',
      });
      setEditFeedback({ type: 'success', message: payload.message });
      setIsEditMode(false);

      setCategoryData((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          sub_categories: current.sub_categories.map((subCategory) => ({
            ...subCategory,
            pages: subCategory.pages.map((page) =>
              page.uuid === selectedPage.uuid ? { ...page, name: payload.page.name } : page,
            ),
          })),
        };
      });
    } catch (error) {
      setEditFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Perubahan isi kategori gagal disimpan.',
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleProtectedAttempt = (event) => {
    event.preventDefault();
    setProtectionNotice('Proteksi dokumen aktif. Copy, print, dan screenshot dibatasi pada halaman ini.');
  };

  return (
    <main className="bg-slate-50">
      <section className="container mx-auto px-4 py-8">
        <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="max-w-3xl animate-fade-up">
            <span className="inline-flex rounded-full bg-red-50 px-4 py-1 text-sm font-medium text-red-700">
              Kategori Dokumentasi
            </span>
            <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">{categoryLabel}</h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Telusuri subkategori dan dokumen terkait dalam tampilan yang lebih rapi, konsisten, dan
              mudah dicari oleh tim.
            </p>
          </div>

          {isLoading ? (
            <div className="mt-8 rounded-2xl bg-slate-50 px-6 py-12 text-center text-slate-500">
              Memuat data kategori...
            </div>
          ) : error ? (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <>
              <div className="animate-fade-up-delay mt-8 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50/80 to-white p-4">
                <div className="flex flex-wrap gap-3">
                  {categoryData?.sub_categories.map((subCategory) => {
                    const isActive = subCategory.uuid === activeSubCategory;

                    return (
                      <button
                        key={subCategory.uuid}
                        type="button"
                        onClick={() => {
                          setActiveSubCategory(subCategory.uuid);
                          setSearchTerm('');
                        }}
                        className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                          isActive
                            ? 'border-red-700 bg-red-700 text-white shadow-sm'
                            : 'border-transparent bg-transparent text-red-700 hover:border-red-200 hover:bg-white'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <FolderIcon active={isActive} />
                          <span>{subCategory.name}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <label className="flex items-center gap-3 text-sm text-slate-600">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-red-500"
                  >
                    {pageSizeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <span>entries</span>
                </label>

                <label className="flex items-center gap-3 text-sm text-slate-600">
                  <span>Search:</span>
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-red-500 md:w-72"
                  />
                </label>
              </div>

              <div
                className="protected-content mt-5 overflow-hidden rounded-2xl border border-slate-200"
                onCopy={handleProtectedAttempt}
                onCut={handleProtectedAttempt}
                onPaste={handleProtectedAttempt}
                onContextMenu={handleProtectedAttempt}
                onDragStart={handleProtectedAttempt}
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-left text-sm text-slate-500">
                      <tr>
                        <th className="px-4 py-4 font-semibold md:w-28">No</th>
                        <th className="px-4 py-4 font-semibold">Page Name</th>
                        <th className="px-4 py-4 font-semibold md:w-72">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {visiblePages.length > 0 ? (
                        visiblePages.map((page, index) => (
                          <tr key={page.uuid} className="text-sm text-slate-600">
                            <td className="px-4 py-6">{startIndex + index + 1}</td>
                            <td className="px-4 py-6 font-normal text-slate-600">{page.name}</td>
                            <td className="px-4 py-4">
                              <button
                                type="button"
                                onClick={() => handleOpenFile(page)}
                                className="inline-flex items-center overflow-hidden rounded-xl bg-red-600 text-white shadow-sm transition hover:bg-red-700"
                              >
                                <span className="flex items-center bg-red-500 px-4 py-3">
                                  <FileIcon />
                                </span>
                                <span className="px-6 py-3 text-sm font-semibold">Open File</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-10 text-center text-sm text-slate-500">
                            Tidak ada file yang cocok untuk subkategori ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
                <p>
                  Showing {totalEntries === 0 ? 0 : startIndex + 1} to {endIndex} of {totalEntries} entries
                </p>

                <div className="inline-flex flex-wrap overflow-hidden rounded-xl border border-slate-300 bg-white">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safeCurrentPage === 1}
                    className="border-r border-slate-300 px-4 py-3 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Previous
                  </button>

                  {pageNumbers.map((pageNumber) => {
                    const isActive = pageNumber === safeCurrentPage;

                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`min-w-12 border-r border-slate-300 px-4 py-3 transition ${
                          isActive
                            ? 'bg-red-600 font-semibold text-white'
                            : 'text-red-700 hover:bg-red-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="px-4 py-3 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {(isPageLoading || selectedPage || pageError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="document-watermark" aria-hidden="true">
              QCPedia Confidential
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-sm font-medium text-red-700">Dokumen QCPedia</p>
                <h2 className="text-xl font-semibold text-slate-900">
                  {selectedPage?.name || 'Membuka file...'}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {selectedPage && isAuthenticatedAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode((current) => !current);
                      setEditFeedback({ type: '', message: '' });
                      setEditForm({
                        page_name: selectedPage.name ?? '',
                        content: selectedPage.content ?? '',
                      });
                    }}
                    className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    {isEditMode ? 'Batal Edit' : 'Edit Isi Kategori'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPage(null);
                    setPageError('');
                    setIsEditMode(false);
                    setEditFeedback({ type: '', message: '' });
                  }}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Tutup
                </button>
              </div>
            </div>

            <div
              className="protected-content relative overflow-y-auto px-6 py-5"
              onCopy={handleProtectedAttempt}
              onCut={handleProtectedAttempt}
              onPaste={handleProtectedAttempt}
              onContextMenu={handleProtectedAttempt}
              onDragStart={handleProtectedAttempt}
            >
              {protectionNotice && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {protectionNotice}
                </div>
              )}

              {editFeedback.message && (
                <div
                  className={`mb-4 rounded-2xl px-4 py-3 text-sm ${
                    editFeedback.type === 'success'
                      ? 'border border-green-200 bg-green-50 text-green-700'
                      : 'border border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {editFeedback.message}
                </div>
              )}

              {isPageLoading ? (
                <div className="py-12 text-center text-slate-500">Memuat isi file...</div>
              ) : pageError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                  {pageError}
                </div>
              ) : selectedPage && isEditMode && isAuthenticatedAdmin ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="page-name" className="mb-2 block text-sm font-medium text-slate-700">
                      Nama dokumen
                    </label>
                    <input
                      id="page-name"
                      type="text"
                      value={editForm.page_name}
                      onChange={(event) =>
                        setEditForm((current) => ({ ...current, page_name: event.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="page-content" className="mb-2 block text-sm font-medium text-slate-700">
                      Isi kategori
                    </label>
                    <textarea
                      id="page-content"
                      value={editForm.content}
                      onChange={(event) =>
                        setEditForm((current) => ({ ...current, content: event.target.value }))
                      }
                      className="min-h-[420px] w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-red-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={isSavingEdit}
                      className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                    >
                      {isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditMode(false);
                        setEditFeedback({ type: '', message: '' });
                        setEditForm({
                          page_name: selectedPage.name ?? '',
                          content: selectedPage.content ?? '',
                        });
                      }}
                      className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : selectedPage ? (
                <article
                  className="protected-content [&_*]:font-sans [&_*]:text-slate-700 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-2 [&_img]:max-w-full [&_img]:h-auto [&_li]:mb-1 [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: selectedPage.content }}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default CategoryBrowser;
