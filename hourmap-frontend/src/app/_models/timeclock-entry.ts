export interface TimeclockEntry {
    id: number;
    userId: string;
    clockIn: string;
    clockOut?: string | null;
    duration?: string;
    numDuration?: number;
    projectId?: number;
    projectName?: string;
    locationId?: number;
    locationName?: string;
    localClockIn?: string;
    localClockOut?: string;
}
