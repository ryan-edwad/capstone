import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-timeclock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './timeclock.component.html',
  styleUrl: './timeclock.component.css'
})
export class TimeclockComponent implements OnDestroy {
  currentTime: Date = new Date();
  clockedIn: boolean = false;
  timeEntries: { timeIn: string; timeOut?: string; duration?: string }[] = [];
  clockForm: FormGroup;
  locations = ['Office', 'Remote', 'Client Site']; // Placeholder for now. TODO: Replace with response from API;
  projects = ['Project 1', 'Project 2', 'Project 3']; // Placeholder for now. TODO: Replace with response from API;
  roles = ['Manager', 'Admin', 'Employee']; // Placeholder for now. TODO: Replace with response from API;

  private clockSubscription!: Subscription;

  constructor(private fb: FormBuilder) {
    this.clockForm = this.fb.group({
      location: [''],
      project: [''],
      role: ['']
    })

  }

  ngOnInit() {
    this.clockSubscription = interval(1000).subscribe(() => {
      this.currentTime = new Date();
    });
  }

  ngOnDestroy(): void {
    if (this.clockSubscription) {
      this.clockSubscription.unsubscribe();
    }
  }

  onSubmit() {
    const formValue = this.clockForm.value;

    if (!this.clockedIn) {
      this.timeEntries.push({ timeIn: new Date().toISOString() });
      this.clockedIn = true;
    }
    else {
      const lastEntry = this.timeEntries[this.timeEntries.length - 1];
      const clockOutTime = new Date();
      lastEntry.timeOut = clockOutTime.toISOString();
      lastEntry.duration = this.calculateDuration(lastEntry.timeIn, lastEntry.timeOut);
      this.clockedIn = false;
    }
    this.clockForm.reset();
  }

  calculateDuration(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationInSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);

    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = durationInSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  }


}
