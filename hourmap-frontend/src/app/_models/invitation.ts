export interface Invitation {
    id: number,
    email: string,
    organizationId: number,
    token: string,
    expirationDate: string
}
