import { API_BASE } from "@/config/api";

function authHeaders() {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function safeFetch(url: string) {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) return null;
  return res.json();
}

// ---- Products ----
export async function fetchProducts() {
  const data = await safeFetch(`${API_BASE}/api/products`);
  if (!data) return [];
  // if API is { items: [...] }
  const items = Array.isArray(data) ? data : (data.items ?? []);
  return items.map((p: any) => ({
    value: p.product_id,
    label: p.name,
  }));
}

// ---- Units ----
export async function fetchUnits() {
  const data = await safeFetch(`${API_BASE}/api/units`);
  if (!data) return [];
  const items = Array.isArray(data) ? data : (data.items ?? []);
  return items.map((u: any) => ({
    value: u.unit_id,
    label: u.name,
  }));
}

// ---- Publications ----
export async function fetchPublications() {
  const data = await safeFetch(`${API_BASE}/api/publications`);
  if (!data) return [];
  const items = Array.isArray(data) ? data : (data.items ?? []);
  return items.map((p: any) => ({
    value: p.publication_id,
    label: p.title,
  }));
}
