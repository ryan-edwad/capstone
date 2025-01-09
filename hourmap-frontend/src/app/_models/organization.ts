import { OrgUser } from "./org-user";

export interface Organization {
    id: number,
    name: string,
    createdAt: Date,
    users: OrgUser[]
}
