export const APP_ROLES = ["admin", "employee"] as const;

export type AppRole = (typeof APP_ROLES)[number];
