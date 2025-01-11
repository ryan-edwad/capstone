import { OrgUser } from "./org-user";
import { Project } from "./project";

export interface Organization {
    id: number,
    name: string,
    createdAt: Date,
    users: OrgUser[],
    projects: Project[]
}
