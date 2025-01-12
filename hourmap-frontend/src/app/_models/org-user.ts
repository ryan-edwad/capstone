import { Project } from "./project";

export interface OrgUser {
    id: string,
    firstName: string,
    lastName: string,
    email: string,
    jobTitle: string,
    payRate: number,
    projects: Project[],
}
