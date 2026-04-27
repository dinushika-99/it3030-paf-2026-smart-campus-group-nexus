import axios from "axios";

const API_BASE_URL = "http://localhost:8081/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ==================== CATEGORY → TYPE MAPPING ====================

export const CATEGORY_TYPES = {
  ACADEMIC: ["LECTURE_HALL", "LABORATORY", "COMPUTER_LAB", "DESIGN_STUDIO", "STUDY_ROOM"],
  SPORTS: ["SWIMMING_POOL", "TENNIS_COURT", "FOOTBALL_FIELD", "BASKETBALL_COURT", "GYM"],
  COMMON: ["AUDITORIUM", "LIBRARY", "FOOD_AREA", "OPEN_SPACE", "PARKING_LOT"],
  ADMINISTRATIVE: ["MEETING_ROOM", "CONFERENCE_ROOM"],
  EQUIPMENT: ["PROJECTOR", "VIDEO_CAMERA", "LAPTOP_SET", "AUDIO_SYSTEM", "MICROPHONE", "SPEAKER"],
};

export const ALL_CATEGORIES = [
  "ACADEMIC",
  "SPORTS",
  "COMMON",
  "ADMINISTRATIVE",
  "EQUIPMENT",
];

// ==================== CATEGORY IMAGES (defaults) ====================

export const CATEGORY_IMAGES = {
  ACADEMIC: "https://mgx-backend-cdn.metadl.com/generate/images/422425/2026-04-21/nbrjxbaaafla/card-lecture-hall.png",
  SPORTS: "https://mgx-backend-cdn.metadl.com/generate/images/422425/2026-04-21/nbrj6saaafma/card-sports-facility.png",
  COMMON: "https://mgx-backend-cdn.metadl.com/generate/images/422425/2026-04-21/nbrj2xaaaflq/hero-campus-facilities.png",
  ADMINISTRATIVE: "https://mgx-backend-cdn.metadl.com/generate/images/422425/2026-04-21/nbrj3eyaafna/card-meeting-room.png",
  EQUIPMENT: "https://mgx-backend-cdn.metadl.com/generate/images/422425/2026-04-21/nbrj3eyaafna/card-meeting-room.png",
};

// ==================== DISPLAY HELPERS ====================

export function formatType(type) {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatCategory(category) {
  return category.charAt(0) + category.slice(1).toLowerCase();
}

export function getLocationString(resource) {
  if (resource.building) {
    const parts = [resource.building];
    if (resource.floor !== null) parts.push(`Floor ${resource.floor}`);
    if (resource.roomNumber) parts.push(`Room ${resource.roomNumber}`);
    return parts.join(", ");
  }
  if (resource.areaName) return resource.areaName;
  return "Not specified";
}

export function formatTime(time) {
  if (!time) return "N/A";
  const parts = time.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

// ==================== API CALLS ====================

export async function getAllResources(params) {
  const { data } = await api.get("/resources", { params });
  return data;
}

export async function getResourceById(id) {
  const { data } = await api.get(`/resources/${id}`);
  return data;
}

export async function createResource(resource) {
  const { data } = await api.post("/resources", resource);
  return data;
}

export async function updateResource(id, resource) {
  const { data } = await api.put(`/resources/${id}`, resource);
  return data;
}

export async function deleteResource(id) {
  await api.delete(`/resources/${id}`);
}

export async function getBookableResources(params) {
  const { data } = await api.get("/resources/bookable", { params });
  return data;
}

export async function searchResources(params) {
  const { data } = await api.get("/resources/search", { params });
  return data;
}

export async function getResourceBookedSlots(resourceId) {
  const { data } = await api.get(`/bookings/resource/${resourceId}/slots`);
  const slots = data?.data || [];
  return Array.isArray(slots)
    ? slots.filter((slot) => String(slot?.status || '').toUpperCase() === 'APPROVED')
    : [];
}