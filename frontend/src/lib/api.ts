import axios from "axios";

const api = axios.create({
    // In development, Vite will proxy /api requests to http://localhost:8000
    // In production, this will relative to the deployed server or use VITE_API_URL
    baseURL: import.meta.env.VITE_API_URL || "/api",
});

export const fetchConfig = () => api.get("/config").then(res => res.data);
export const saveConfig = (data: any) => api.post("/config", data).then(res => res.data);
export const fetchLogs = () => api.get("/logs").then(res => res.data);
export const fetchBookings = () => api.get("/bookings").then(res => res.data);
export const fetchStats = () => api.get("/stats").then(res => res.data);
export const fetchContacts = () => api.get("/contacts").then(res => res.data);

export const getTranscriptUrl = (logId: string) => `/api/logs/${logId}/transcript`;

// Vobiz Phone Number APIs
export const fetchOwnedNumbers = () => api.get("/vobiz/numbers/owned").then(res => res.data);
export const fetchAvailableNumbers = (country: string, limit = 20, areaCode = "") =>
    api.get("/vobiz/numbers/available", { params: { country, limit, area_code: areaCode } }).then(res => res.data);
export const purchaseNumber = (body: Record<string, any>) =>
    api.post("/vobiz/numbers/purchase", body).then(res => res.data);

export default api;
