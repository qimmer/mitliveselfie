export const userGroups = ["admin", "developer"] as const;
export type UserGroup = (typeof userGroups)[number];
