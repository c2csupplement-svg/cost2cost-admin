"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_BASE;

function getAuthHeaders() {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("pm_admin_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const TABS = [
  { id: "general", label: "General" },
  { id: "social", label: "Social (OG & Twitter)" },
  { id: "schema", label: "Structured Data" },
];

const EMPTY_FORM = {
  pageLabel: "",
  metaTitle: "",
  metaDescription: "",
  keywords: "",
  canonical: "",
  robots: "index, follow",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  ogUrl: "",
  twitterCard: "summary_large_image",
  twitterTitle: "",
  twitterDescription: "",
  twitterImage: "",
  schemaJson: "",
};

export default function PageSeoManager() {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState("general");
  const [loadingPages, setLoadingPages] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newPageKey, setNewPageKey] = useState("");
  const [newPageLabel, setNewPageLabel] = useState("");
  const [addError, setAddError] = useState("");

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

const loadPages = useCallback(async (selectAfter) => {
  setLoadingPages(true);
  try {
    const res = await axios.get(`${API_URL}page-seo/dashboard/all`, {
      headers: getAuthHeaders(),
    });
    const list = res.data.pages || [];
    setPages(list);

    if (selectAfter) {
      setSelectedPage(selectAfter);
    } else if (list.length > 0 && !selectedPage) {
      setSelectedPage(list[0].pageKey);
    }
  } catch (err) {
    console.error("Load pages error:", err); 
    showToast("error", "Failed to load pages");
  } finally { 
    setLoadingPages(false);
  }
}, []);

useEffect(() => {
  loadPages();
}, []);


useEffect(() => {
  if (!selectedPage) return;
  const page = pages.find((p) => p.pageKey === selectedPage);
  if (page) {
    // NAYA — null values ko empty string mein convert karein
    const cleanedPage = {};
    for (const key in page) {
      cleanedPage[key] = page[key] === null || page[key] === undefined ? "" : page[key];
    }
    setFormData({ ...EMPTY_FORM, ...cleanedPage });
    setActiveTab("general");
  }
}, [selectedPage, pages]);




  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API_URL}page-seo/${selectedPage}`, formData, {
        headers: getAuthHeaders(),
      });
      showToast("success", "SEO settings saved successfully");
      await loadPages(selectedPage);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to save SEO settings");
    }
    setSaving(false);
  };

  const handleAddPage = async (e) => {
    e.preventDefault();
    setAddError("");

    if (!newPageKey.trim() || !newPageLabel.trim()) {
      setAddError("Both page key and label are required");
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}page-seo/dashboard/create`,
        { pageKey: newPageKey.trim(), pageLabel: newPageLabel.trim() },
        { headers: getAuthHeaders() }
      );
      setNewPageKey("");
      setNewPageLabel("");
      setShowAddModal(false);
      await loadPages(res.data.page.pageKey);
      showToast("success", "Page created successfully");
    } catch (err) {
      setAddError(err.response?.data?.message || "Failed to create page");
    }
  };

  const handleDeletePage = async (pageKey, e) => {
    e.stopPropagation();
    if (!confirm(`Delete SEO settings for "${pageKey}"? This cannot be undone.`)) return;

    try {
      await axios.delete(`${API_URL}page-seo/dashboard/${pageKey}`, {
        headers: getAuthHeaders(),
      });
      showToast("success", "Page deleted");
      if (selectedPage === pageKey) setSelectedPage(null);
      await loadPages();
    } catch (err) {
      showToast("error", "Failed to delete page");
    }
  };

  const currentPage = pages.find((p) => p.pageKey === selectedPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <h1 className="text-2xl font-semibold text-gray-900">Page SEO Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage meta tags, social previews and structured data for every page on your site.
        </p>
      </div>

      <div className="flex max-w-7xl mx-auto gap-6 p-6">
        {/* Sidebar — Page List */}
        <aside className="w-72 shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Pages</span>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                + Add Page
              </button>
            </div>

            {loadingPages ? (
              <div className="p-4 text-sm text-gray-400">Loading pages...</div>
            ) : pages.length === 0 ? (
              <div className="p-4 text-sm text-gray-400">No pages yet. Add one to get started.</div>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
                {pages.map((p) => (
                  <li
                    key={p.pageKey}
                    onClick={() => setSelectedPage(p.pageKey)}
                    className={`group flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                      selectedPage === p.pageKey
                        ? "bg-indigo-50 border-l-2 border-indigo-600"
                        : "hover:bg-gray-50 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          selectedPage === p.pageKey ? "text-indigo-700" : "text-gray-800"
                        }`}
                      >
                        {p.pageLabel || p.pageKey}
                      </p>
                      <p className="text-xs text-gray-400 truncate">/{p.pageKey}</p>
                    </div>
                    <button
                      onClick={(e) => handleDeletePage(p.pageKey, e)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs shrink-0 ml-2 transition-opacity"
                      title="Delete page"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Main Panel — SEO Form */}
        <main className="flex-1 min-w-0">
          {!selectedPage ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">
              Select a page from the left, or add a new one to begin.
            </div>
          ) : (
            <form onSubmit={handleSave} className="bg-white rounded-lg border border-gray-200">
              {/* Form Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentPage?.pageLabel || selectedPage}
                  </h2>
                  <p className="text-xs text-gray-400">/{selectedPage}</p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-md transition-colors"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>

              {/* Tabs */}
              <div className="px-6 border-b border-gray-100 flex gap-6">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Page Label — always visible */}
                <Field label="Page Label" hint="Internal name shown in the sidebar (e.g. Home Page)">
                  <input
                    name="pageLabel"
                    value={formData.pageLabel}
                    onChange={handleChange}
                    className="input"
                  />
                </Field>

                {/* GENERAL TAB */}
                {activeTab === "general" && (
                  <div className="space-y-5 mt-2">
                    <Field
                      label="Meta Title"
                    hint={`${(formData.metaTitle || "").length}/60 characters recommended`}
                    >
                      <input
                        name="metaTitle"
                        value={formData.metaTitle}
                        onChange={handleChange}
                        maxLength={70}
                        className="input"
                        placeholder="Page title shown in search results"
                      />
                    </Field>

                    <Field
                      label="Meta Description"
                      hint={`${(formData.metaTitle || "").length}/60 characters recommended`}
                    >
                      <textarea
                        name="metaDescription"
                        value={formData.metaDescription}
                        onChange={handleChange}
                        maxLength={200}
                        rows={3}
                        className="input resize-none"
                        placeholder="Short summary shown under the title in search results"
                      />
                    </Field>

                    <Field label="Focus Keywords" hint="Comma separated">
                      <input
                        name="keywords"
                        value={formData.keywords}
                        onChange={handleChange}
                        className="input"
                        placeholder="protein, whey, supplements"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-5">
                      <Field label="Canonical URL">
                        <input
                          name="canonical"
                          value={formData.canonical}
                          onChange={handleChange}
                          className="input"
                          placeholder="https://yoursite.com/page"
                        />
                      </Field>

                      <Field label="Robots Meta Tag">
                        <select
                          name="robots"
                          value={formData.robots}
                          onChange={handleChange}
                          className="input"
                        >
                          <option value="index, follow">index, follow</option>
                          <option value="noindex, follow">noindex, follow</option>
                          <option value="index, nofollow">index, nofollow</option>
                          <option value="noindex, nofollow">noindex, nofollow</option>
                        </select>
                      </Field>
                    </div>
                  </div>
                )}

                {/* SOCIAL TAB */}
                {activeTab === "social" && (
                  <div className="space-y-6 mt-2">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Facebook / Open Graph</h3>
                      <div className="space-y-4">
                        <Field label="OG Title">
                          <input name="ogTitle" value={formData.ogTitle} onChange={handleChange} className="input" />
                        </Field>
                        <Field label="OG Description">
                          <textarea
                            name="ogDescription"
                            value={formData.ogDescription}
                            onChange={handleChange}
                            rows={2}
                            className="input resize-none"
                          />
                        </Field>
                        <div className="grid grid-cols-2 gap-5">
                          <Field label="OG Image URL">
                            <input name="ogImage" value={formData.ogImage} onChange={handleChange} className="input" />
                          </Field>
                          <Field label="OG Target URL">
                            <input name="ogUrl" value={formData.ogUrl} onChange={handleChange} className="input" />
                          </Field>
                        </div>
                        {formData.ogImage && (
                          <div className="mt-2 border border-gray-200 rounded-md overflow-hidden w-48">
                            <img src={formData.ogImage} alt="OG preview" className="w-full h-28 object-cover" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 mt-4">Twitter Card</h3>
                      <div className="space-y-4">
                        <Field label="Card Type">
                          <select
                            name="twitterCard"
                            value={formData.twitterCard}
                            onChange={handleChange}
                            className="input"
                          >
                            <option value="summary_large_image">summary_large_image</option>
                            <option value="summary">summary</option>
                            <option value="player">player</option>
                          </select>
                        </Field>
                        <Field label="Twitter Title">
                          <input
                            name="twitterTitle"
                            value={formData.twitterTitle}
                            onChange={handleChange}
                            className="input"
                          />
                        </Field>
                        <Field label="Twitter Description">
                          <textarea
                            name="twitterDescription"
                            value={formData.twitterDescription}
                            onChange={handleChange}
                            rows={2}
                            className="input resize-none"
                          />
                        </Field>
                        <Field label="Twitter Image URL">
                          <input
                            name="twitterImage"
                            value={formData.twitterImage}
                            onChange={handleChange}
                            className="input"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCHEMA TAB */}
                {activeTab === "schema" && (
                  <div className="mt-2">
                    <Field
                      label="JSON-LD Structured Data"
                      hint="Valid JSON only. Leave empty to skip structured data for this page."
                    >
                      <textarea
                        name="schemaJson"
                        value={formData.schemaJson}
                        onChange={handleChange}
                        rows={12}
                        className="input font-mono text-xs resize-none"
                        placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "WebSite",\n  "name": "Your Site Name",\n  "url": "https://yoursite.com"\n}`}
                        spellCheck={false}
                      />
                    </Field>
                  </div>
                )}
              </div>
            </form>
          )}
        </main>
      </div>

      {/* Add Page Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Add New Page</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create an SEO entry for a new page on your site.
            </p>

            <form onSubmit={handleAddPage} className="space-y-4">
              <Field label="Page Label" hint="Shown in the sidebar">
                <input
                  value={newPageLabel}
                  onChange={(e) => setNewPageLabel(e.target.value)}
                  className="input"
                  placeholder="e.g. Refund Policy"
                  autoFocus
                />
              </Field>
              <Field label="Page Key" hint="Used in the URL, lowercase, no spaces">
                <input
                  value={newPageKey}
                  onChange={(e) => setNewPageKey(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  className="input"
                  placeholder="e.g. refund-policy"
                />
              </Field>

              {addError && <p className="text-sm text-red-500">{addError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddError("");
                    setNewPageKey("");
                    setNewPageLabel("");
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                >
                  Create Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-md shadow-lg text-sm font-medium text-white ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.text}
        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
      `}</style>
    </div>
  );
}

// Reusable field wrapper — label + hint + input
function Field({ label, hint, children }) {
  return (
    <div className="mb-1">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}