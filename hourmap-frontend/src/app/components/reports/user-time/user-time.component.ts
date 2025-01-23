import { Component, OnInit, inject } from '@angular/core';
import { Organization } from '../../../_models/organization';
import { TimeclockEntry } from '../../../_models/timeclock-entry';
import { TimeclockService } from '../../../_services/timeclock.service';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrgUser } from '../../../_models/org-user';

@Component({
  selector: 'app-user-time',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-time.component.html',
  styleUrl: './user-time.component.css'
})
export class UserTimeComponent implements OnInit {
  selectedUserId: string | null = null;
  startDate: string = '';
  endDate: string = '';
  userTimeEntries: TimeclockEntry[] = [];
  searchStarted: boolean = false;
  searchText: string = '';
  filteredUsers: OrgUser[] = [];
  reportGenerated: boolean = false;
  timeClockService = inject(TimeclockService);
  organization: Organization = { id: 0, name: 'Default Loaded, Check the Logs', createdAt: new Date(), users: [], projects: [], locations: [], invitations: [] };

  constructor(private router: Router) { }
  ngOnInit() {
    console.log('User Time Component Initialized');
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error("No authentication found. Please log in.");
      this.router.navigate(['/login']);
      return;
    }

    let organizationId: number | null = null;
    try {
      const decodedToken: any = jwtDecode(token);
      console.log('Decoded token:', decodedToken);
      organizationId = decodedToken.OrganizationId ? parseInt(decodedToken.OrganizationId) : 0;
    } catch (err) {
      console.error('Failed to decode token:', err);
      this.router.navigate(['/login']);
      return;
    }

    this.getOrganization(organizationId);
  }

  // Get the organization data
  getOrganization(organizationId: number) {
    this.timeClockService.getOrganizationDetails(organizationId).subscribe({
      next: (data) => {
        this.organization = {
          ...data,
          users: data.users || [],
          projects: data.projects || [],
          locations: data.locations || []
        };
        console.log('Loading organization:', this.organization);
      },
      error: (err) => console.error('Failed to load organization: ', err)
    });

  }

  fetchUserTimeEntries() {
    if (this.selectedUserId === null || !this.startDate || !this.endDate) return;

    this.timeClockService.getTimeEntriesByUserAndDateRange(this.selectedUserId, new Date(this.startDate), new Date(this.endDate)).subscribe({
      next: (entries: TimeclockEntry[]) => {
        this.userTimeEntries = entries.map(entry => ({
          ...entry,
          clockIn: this.convertUtcToLocal(entry.clockIn),
          clockOut: entry.clockOut ? this.convertUtcToLocal(entry.clockOut) : null,
          numDuration: this.convertIsoToDecimalHours(entry.duration ?? 'PT0H0M0S')
        }));
        console.log('User Time Entries:', this.userTimeEntries);
      }
      ,
      error: (err) => {
        console.error('Failed to load user time entries: ', err);
        this.reportGenerated = true;
        this.userTimeEntries = [];
      }
    });
  }

  filterUsers(event: any) {
    const searchTerm = event.target.value.toLowerCase().trim();
    if (!searchTerm) {
      this.filteredUsers = [];
      this.searchStarted = false;
    }
    else {
      this.filteredUsers = this.organization.users
        .filter(user => user.lastName.toLowerCase()
          .includes(searchTerm) || user.firstName.toLowerCase().includes(searchTerm));
      this.searchStarted = true;
    }
  }

  selectUser(user: OrgUser) {
    console.log('Selected User:', user);
    this.selectedUserId = user.id;

    this.searchText = `${user.firstName} ${user.lastName}`;
    this.filteredUsers = [];
    this.searchStarted = false;
  }

  convertIsoToDecimalHours(durationIso: string): number {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(\.\d+)?)S)?/;
    const matches = durationIso.match(regex);

    if (!matches) {
      console.error('Invalid ISO duration:', durationIso);
      return 0;
    }

    const hours = parseFloat(matches[1] || '0');
    const minutes = parseFloat(matches[2] || '0');
    const seconds = parseFloat(matches[3] || '0');

    const decimalHours = hours + minutes / 60 + seconds / 3600;

    console.log(`Parsed Duration: ${hours}h ${minutes}m ${seconds}s => Decimal Hours: ${decimalHours}`);
    return decimalHours;
  }

  convertUtcToLocal(utcDate: string): string {
    const utcDateObj = new Date(utcDate);
    const localDateObj = new Date(utcDateObj.getTime() - utcDateObj.getTimezoneOffset() * 60000);

    console.log(`UTC: ${utcDate}, Local: ${localDateObj.toLocaleString('en-US', { timeZoneName: 'short' })}`);
    return localDateObj.toLocaleString('en-US', { hour12: true });
  }


}




