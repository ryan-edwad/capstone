import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Project } from '../../_models/project';
import { WorkLocation } from '../../_models/work-location';
import { TimeclockService } from '../../_services/timeclock.service';
import { TimeclockEntry } from '../../_models/timeclock-entry';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TreasurePathBackgroundComponent } from '../treasure-path-background/treasure-path-background.component';

/**
 * Timeclock component, for clocking in and out, and for users to see recent entries
 */
@Component({
  selector: 'app-timeclock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatTooltipModule, TreasurePathBackgroundComponent],
  templateUrl: './timeclock.component.html',
  styleUrl: './timeclock.component.css'
})
export class TimeclockComponent implements OnDestroy {
  currentTime: Date = new Date();
  clockedIn: boolean = false;
  timeClockService: TimeclockService;
  timeEntries: TimeclockEntry[] = [];
  clockForm: FormGroup;
  locations: WorkLocation[] = [];
  projects: Project[] = [];
  roles = ['Manager', 'Admin', 'Employee'];
  selectedTimeRange: string = 'today';
  totalDuration: number = 0;
  filteredTimeEntries: TimeclockEntry[] = [];
  displayedEntries: TimeclockEntry[] = [];

  private clockSubscription!: Subscription;

  constructor(private fb: FormBuilder, timeClockService: TimeclockService, private cdr: ChangeDetectorRef) {
    this.clockForm = this.fb.group({
      location: [''],
      project: [''],
      role: ['']
    }),
      this.timeClockService = timeClockService;

  }

  ngOnInit(): void {
    this.clockSubscription = interval(1000).subscribe(() => {
      this.currentTime = new Date();
    });

    this.getRecentEntry();

    this.timeClockService.getLocations().subscribe({
      next: (locations) => {
        console.log('Fetched Locations:', locations);
        this.locations = locations;
        if (locations.length > 0) {
          console.log('Setting default location ID:', locations[0].id);
          this.clockForm.patchValue({ location: locations[0].id });
        }
      },
      error: (err) => console.error('Error getting locations', err)
    });

    this.timeClockService.getProjectsByUser().subscribe({
      next: (projects) => {
        console.log('Fetched Projects:', projects);
        this.projects = projects
        if (projects.length > 0) {
          console.log('Setting default project ID:', projects[0].id);
          this.clockForm.patchValue({ project: projects[0].id });
        }
      },
      error: (err) => console.error('Error getting projects', err)
    });

    this.loadTimeEntriesForPayPeriod();

  }

  ngOnDestroy(): void {
    if (this.clockSubscription) {
      this.clockSubscription.unsubscribe();
    }
  }

  onSubmit() {
    if (!this.clockedIn) {
      const selectedProjectId = this.clockForm.get('project')?.value;
      const selectedLocationId = this.clockForm.get('location')?.value;
      this.clockIn(selectedProjectId, selectedLocationId);

    }
    else {
      const lastEntry = this.timeEntries[this.timeEntries.length - 1];
      const timeEntryId = lastEntry.id;
      this.clockForm.patchValue({ location: lastEntry.locationId });
      this.clockForm.patchValue({ project: lastEntry.projectId });

      this.timeClockService.clockOut(timeEntryId).subscribe({
        next: (response) => {
          lastEntry.clockOut = response.clockOut;
          lastEntry.duration = this.calculateDuration(lastEntry.clockIn, lastEntry.clockOut ? lastEntry.clockOut : '');
          this.clockedIn = false;
          console.log('Clock out successful!', response);
          if (this.locations.length > 0) {
            this.clockForm.patchValue({ location: this.locations[0].id });
          }
          if (this.projects.length > 0) {
            this.clockForm.patchValue({ project: this.projects[0].id });
          }
          this.loadTimeEntriesForPayPeriod();
        },
        error: (err) => {
          console.error('Error clocking out', err);
        }
      });
    }
    this.cdr.detectChanges();
  }

  clockIn(selectedProjectId: number, selectedLocationId: number) {
    this.timeClockService.clockIn(selectedProjectId, selectedLocationId).subscribe({
      next: (response) => {
        this.clockedIn = true;

        const timeEntry = response.timeEntryDto;

        console.log(timeEntry.locationId);
        console.log(timeEntry.projectId)

        this.clockForm.patchValue({
          project: timeEntry.projectId,
          location: timeEntry.locationId
        });

        console.log('Clock in successful!', response);
        this.loadTimeEntriesForPayPeriod();
      },
      error: (err) => {
        console.error('Error clocking in', err);
      }
    });
  }

  getRecentEntry() {
    this.timeClockService.getRecentEntry().subscribe({
      next: (response) => {
        if (response && !response.clockOut) {
          this.clockedIn = true;
          this.clockForm.patchValue({
            location: response.locationId || (this.locations[0].id ?? ''),
            project: response.projectId || (this.projects[0].id ?? '')
          });
        }
        else {
          this.clockForm.patchValue({
            location: this.locations[0]?.id,
            project: this.projects[0]?.id
          })
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error getting recent time entry', err);
      }
    });
  }

  calculateDuration(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();

    const durationInSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = durationInSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  }

  loadTimeEntriesForPayPeriod() {
    const { startDate, endDate } = this.calculatePayPeriodDates();

    this.timeClockService.getTimeEntriesByDates(startDate, endDate).subscribe({
      next: (entries) => {

        this.timeEntries = entries.map(entry => ({
          ...entry,
          clockIn: new Date(entry.clockIn + 'Z').toLocaleString(),
          clockOut: entry.clockOut ? new Date(entry.clockOut + 'Z').toLocaleString() : null,
          numDuration: this.convertIsoToDecimalHours(entry.duration ?? '0')
        }));
        this.filterTimeEntries();
      },
      error: (err) => {
        console.error('Error loading time entries for pay period:', err)
      }
    });
  }

  calculatePayPeriodDates(): { startDate: string; endDate: string } {
    const today = new Date();
    const isSecondHalf = today.getDate() > 15; // Assuming bi-monthly pay period
    const startDate = new Date(today.getFullYear(), today.getMonth(), isSecondHalf ? 16 : 1);

    // Have to account for the full day that the period ends on, not just up until that day starts.
    const endDate = isSecondHalf
      ? new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
      : new Date(today.getFullYear(), today.getMonth(), 15, 23, 59, 59, 999);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString(),
    };
  }

  filterTimeEntries() {
    const today = new Date().toISOString().split('T')[0];

    if (this.selectedTimeRange === 'today') {
      this.filteredTimeEntries = this.timeEntries.filter(
        (entry) => entry.clockIn.split('T')[0] === today
      );
    } else if (this.selectedTimeRange === 'payPeriod') {
      this.filteredTimeEntries = [...this.timeEntries];
    }
    this.updateDisplayedEntries();
  }

  convertIsoToDecimalHours(durationIso: string): number {
    const regex = /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(\.\d+)?)S)?/;
    const matches = durationIso.match(regex);

    if (!matches) {
      console.error('Invalid ISO duration:', durationIso);
      return 0;
    }

    const days = parseFloat(matches[1] || '0');
    const hours = parseFloat(matches[2] || '0');
    const minutes = parseFloat(matches[3] || '0');
    const seconds = parseFloat(matches[4] || '0');

    const decimalHours = (days * 24) + hours + (minutes / 60) + (seconds / 3600);

    console.log(
      `Parsed Duration: ${days}d ${hours}h ${minutes}m ${seconds}s => Decimal Hours: ${decimalHours}`
    );
    return decimalHours;
  }

  updateDisplayedEntries() {
    if (this.selectedTimeRange === 'today') {
      const today = new Date();
      this.filteredTimeEntries = this.timeEntries.filter(entry =>
        this.isSameDay(new Date(entry.clockIn), today)
      );
    } else if (this.selectedTimeRange === 'payPeriod') {
      this.filteredTimeEntries = [...this.timeEntries];
    }

    this.totalDuration = this.filteredTimeEntries.reduce((total, entry) => {
      const durationInDecimal = this.convertIsoToDecimalHours(entry.duration || 'PT0H0M0S');
      return total + durationInDecimal;
    }, 0);
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }




}
