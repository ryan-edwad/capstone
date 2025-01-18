export interface TimeclockEntry {
    id: number;
    userId: string;
    clockIn: string;
    clockOut?: string;
    duration?: string;
    numDuration?: number;
    projectId?: number;
    locationId?: number;
}
