import { OrgUser } from "./org-user";
import { Project } from "./project";
import { WorkLocation } from "./work-location";

export interface Organization {
    id: number,
    name: string,
    createdAt: Date,
    users: OrgUser[],
    projects: Project[],
    locations: WorkLocation[]
}
