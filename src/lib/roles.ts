import type { Role } from "./types";

export function pathForRole(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "owner") return "/owner";
  return "/concierge";
}

export function needsMasterPin(role: Role) {
  return role === "owner" || role === "admin";
}

export function hasOwnerAccess(role: Role) {
  return role === "owner" || role === "admin";
}

export function roleLabel(role: Role) {
  if (role === "admin") return "Administrator";
  if (role === "owner") return "Captain";
  return "Concierge";
}

export function roleTabLabel(role: Role) {
  if (role === "admin") return "admin";
  if (role === "owner") return "captain";
  return "concierge";
}

export function isProtectedOwnerName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ") === "captain chip";
}
