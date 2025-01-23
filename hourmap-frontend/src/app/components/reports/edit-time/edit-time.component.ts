import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Project } from '../../../_models/project';
import { WorkLocation } from '../../../_models/work-location';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TimeclockService } from '../../../_services/timeclock.service';
import { TimeclockEntry } from '../../../_models/timeclock-entry';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-time',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-time.component.html',
  styleUrl: './edit-time.component.css'
})
export class EditTimeComponent {
  editTimeEntryForm!: FormGroup;
  projects: Project[] = [];
  locations: WorkLocation[] = [];
  userId: string = '';

  constructor(
    private dialogRef: MatDialogRef<EditTimeComponent>,
    private fb: FormBuilder,
    private timeClockService: TimeclockService,
    @Inject(MAT_DIALOG_DATA) public entry: TimeclockEntry
  ) {
    if (!entry) {
      console.error('No entry provided to edit');
      return;
    }

    this.userId = entry.userId;

    this.editTimeEntryForm = this.fb.group({
      clockIn: [this.formatDateTime(entry.clockIn), Validators.required],
      clockOut: [entry.clockOut ? this.formatDateTime(entry.clockOut) : null],
      projectId: [entry.projectId, Validators.required],
      locationId: [entry.locationId, Validators.required]
    });

    this.loadProjects();
    this.loadLocations();
  }

  private formatDateTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toISOString().slice(0, 16);
  }

  loadProjects() {
    this.timeClockService.getProjectsByUserId(this.userId).subscribe({
      next: (data) => {
        this.projects = data;
      },
      error: (err) => {
        console.error('Failed to load projects, error: ', err);
      }
    });
  }

  loadLocations() {
    this.timeClockService.getLocations().subscribe({
      next: (data) => {
        this.locations = data;
      },
      error: (err) => {
        console.error('Failed to load locations, error: ', err);
      }
    });
  }

  submit() {
    if (this.editTimeEntryForm.invalid) return;
    const updatedEntry = this.editTimeEntryForm.value;
    updatedEntry.id = this.entry.id;
    updatedEntry.userId = this.userId;
    console.log('Submitted updated time entry:', updatedEntry);

    this.timeClockService.updateTimeEntry(updatedEntry).subscribe({
      next: (data) => {
        console.log('Time entry updated successfully:', data);
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Failed to update time entry, error: ', err);
      }
    });
  }

  close() {
    console.log('Closing dialog');
    this.dialogRef.close(false);
  }





}
