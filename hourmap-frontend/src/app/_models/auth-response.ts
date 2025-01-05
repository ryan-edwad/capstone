export interface AuthResponse {
    token: string;
    userId: string;
    email: string;
    organizationId?: string;
    roles: string[];
}
