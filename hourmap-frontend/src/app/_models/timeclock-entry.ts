export interface TimeclockEntry {
    id: number;
    userId: string;
    clockIn: string;
    clockOut?: string | null;
    duration?: string;
    numDuration?: number;
    projectId?: number;
    locationId?: number;
    localClockIn?: string;
    localClockOut?: string;
}
