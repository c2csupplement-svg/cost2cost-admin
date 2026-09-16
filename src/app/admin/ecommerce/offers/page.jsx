"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_BASE;

function getAuthHeaders() {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("pm_admin_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const EMPTY_FORM = {
  id: null,
  name: "",
  triggerProduct: null, // { id, name, featuredimg }
  triggerQuantity: 1,
  freeProduct: null,
  freeQuantity: 1,
  startsAt: "",
  endsAt: "",
  isActive: true,
};

export default function OffersManager() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState(null);
  const [formError, setFormError] = useState("");

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/offers/dashboard/all`, {
        headers: getAuthHeaders(),
      });
      setOffers(res.data.offers || []);
    } catch (err) {
      showToast("error", "Failed to load offers");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (offer) => {
    setForm({
      id: offer.id,
      name: offer.name,
      triggerProduct: offer.triggerProduct,
      triggerQuantity: offer.triggerQuantity,
      freeProduct: offer.freeProduct,
      freeQuantity: offer.freeQuantity,
      startsAt: offer.startsAt ? offer.startsAt.slice(0, 10) : "",
      endsAt: offer.endsAt ? offer.endsAt.slice(0, 10) : "",
      isActive: offer.isActive,
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim()) return setFormError("Offer name is required");
    if (!form.triggerProduct) return setFormError("Select a trigger product");
    if (!form.freeProduct) return setFormError("Select a free product");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        triggerProductId: form.triggerProduct.id,
        triggerQuantity: Number(form.triggerQuantity) || 1,
        freeProductId: form.freeProduct.id,
        freeQuantity: Number(form.freeQuantity) || 1,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
        isActive: form.isActive,
      };

      if (form.id) {
        await axios.put(`${API_URL}/api/offers/${form.id}`, payload, { headers: getAuthHeaders() });
        showToast("success", "Offer updated");
      } else {
        await axios.post(`${API_URL}/api/offers`, payload, { headers: getAuthHeaders() });
        showToast("success", "Offer created");
      }

      setShowModal(false);
      await loadOffers();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save offer");
    }
    setSaving(false);
  };

  const handleDelete = async (offerId) => {
    if (!confirm("Delete this offer? This cannot be undone.")) return;
    try {
      await axios.delete(`${API_URL}/api/offers/${offerId}`, { headers: getAuthHeaders() });
      showToast("success", "Offer deleted");
      await loadOffers();
    } catch (err) {
      showToast("error", "Failed to delete offer");
    }
  };

  const handleToggleActive = async (offer) => {
    try {
      await axios.put(
        `${API_URL}/api/offers/${offer.id}`,
        { isActive: !offer.isActive },
        { headers: getAuthHeaders() }
      );
      showToast("success", offer.isActive ? "Offer deactivated" : "Offer activated");
      await loadOffers();
    } catch (err) {
      showToast("error", "Failed to update offer");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Offers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage "Buy X Get Y Free" offers — same product (BOGO) or cross-product bundles.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-md transition-colors"
        >
          + Create Offer
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading offers...</div>
          ) : offers.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No offers yet. Click "Create Offer" to add one.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Offer</th>
                  <th className="px-5 py-3 font-medium">Buy</th>
                  <th className="px-5 py-3 font-medium">Get Free</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{offer.name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {offer.triggerProduct?.featuredimg && (
                          <img
                            src={offer.triggerProduct.featuredimg}
                            alt=""
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="text-gray-800 truncate max-w-[180px]">
                            {offer.triggerProduct?.name}
                          </p>
                          <p className="text-xs text-gray-400">Qty: {offer.triggerQuantity}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {offer.freeProduct?.featuredimg && (
                          <img
                            src={offer.freeProduct.featuredimg}
                            alt=""
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="text-gray-800 truncate max-w-[180px]">
                            {offer.freeProduct?.name}
                          </p>
                          <p className="text-xs text-gray-400">Qty: {offer.freeQuantity}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {offer.startsAt || offer.endsAt ? (
                        <>
                          {offer.startsAt ? new Date(offer.startsAt).toLocaleDateString() : "—"}
                          {" → "}
                          {offer.endsAt ? new Date(offer.endsAt).toLocaleDateString() : "—"}
                        </>
                      ) : (
                        "No limit"
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleActive(offer)}
                        className={`text-xs font-medium px-3 py-1 rounded-full ${
                          offer.isActive
                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {offer.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right space-x-3">
                      <button
                        onClick={() => openEditModal(offer)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(offer.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <OfferFormModal
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          saving={saving}
          error={formError}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-md shadow-lg text-sm font-medium text-white ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

// ---- Modal: Create / Edit Offer ----
function OfferFormModal({ form, setForm, onSave, onClose, saving, error }) {
  const isEdit = !!form.id;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Offer" : "Create New Offer"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Same product for both = Buy 1 Get 1 Free. Different products = bundle offer.
          </p>
        </div>

        <form onSubmit={onSave} className="p-6 space-y-5">
          <Field label="Offer Name">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="e.g. Warflex - Buy 1 Get 1 Free"
            />
          </Field>

          <Field label="Trigger Product (what the customer buys)">
            <ProductPicker
              selected={form.triggerProduct}
              onSelect={(p) => setForm({ ...form, triggerProduct: p })}
            />
          </Field>

          <Field label="Trigger Quantity" hint="How many units must be bought">
            <input
              type="number"
              min={1}
              value={form.triggerQuantity}
              onChange={(e) => setForm({ ...form, triggerQuantity: e.target.value })}
              className="input"
            />
          </Field>

          <Field label="Free Product (what the customer gets free)">
            <ProductPicker
              selected={form.freeProduct}
              onSelect={(p) => setForm({ ...form, freeProduct: p })}
            />
          </Field>

          <Field label="Free Quantity" hint="How many units are given free">
            <input
              type="number"
              min={1}
              value={form.freeQuantity}
              onChange={(e) => setForm({ ...form, freeQuantity: e.target.value })}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Starts On (optional)">
              <input
                type="date"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Ends On (optional)">
              <input
                type="date"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                className="input"
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md"
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Offer"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
        }
        .input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
      `}</style>
    </div>
  );
}

// ---- Product Search Picker ----
function ProductPicker({ selected, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axios.get(`${API_URL}/api/products/search`, {
          params: { q: query, all: "true", limit: 8 },
          headers: getAuthHeaders(),
        });
        setResults(res.data.products || []);
      } catch (err) {
        setResults([]);
      }
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  if (selected) {
    return (
      <div className="flex items-center gap-3 border border-gray-200 rounded-md p-2">
        {selected.featuredimg && (
          <img src={selected.featuredimg} alt="" className="w-10 h-10 rounded object-cover" />
        )}
        <span className="text-sm text-gray-800 flex-1 truncate">{selected.name}</span>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-xs text-red-500 hover:text-red-700 px-2"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Type product name to search..."
        className="input"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto">
          {searching ? (
            <div className="p-3 text-sm text-gray-400">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-gray-400">No products found</div>
          ) : (
            results.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onSelect({ id: p.id, name: p.name, featuredimg: p.featuredimg });
                  setQuery("");
                  setOpen(false);
                }}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer"
              >
                {p.featuredimg && (
                  <img src={p.featuredimg} alt="" className="w-8 h-8 rounded object-cover" />
                )}
                <span className="text-sm text-gray-800 truncate">{p.name}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}