import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PayrollObject } from '../../../_models/payroll-object';
import { TimeclockService } from '../../../_services/timeclock.service';
import { Organization } from '../../../_models/organization';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-time',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-time.component.html',
  styleUrl: './project-time.component.css'
})
export class ProjectTimeComponent implements OnInit {
  timeclockService = inject(TimeclockService);
  projectReport: PayrollObject[] = [];
  selectedProjectId: number | null = null;
  reportGenerated: boolean = false;
  startDate: string = '';
  endDate: string = '';
  organization: Organization = { id: 0, name: 'Default Loaded, Check the Logs', createdAt: new Date(), users: [], projects: [], locations: [] };

  constructor(private router: Router) { }

  ngOnInit() {
    console.log('Project Time Component Initialized');
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
  fetchProjectReport() {
    if (!this.selectedProjectId || !this.startDate || !this.endDate) return;

    this.timeclockService.getProjectReport(this.selectedProjectId, this.startDate, this.endDate)
      .subscribe({
        next: (data: PayrollObject[]) => {
          this.projectReport = data;
          this.reportGenerated = true;
          console.log('Project report:', data);
        },
        error: (err) => {
          console.error('Failed to grab project report', err);
          this.projectReport = [];
          this.reportGenerated = true;
        }
      })
  }

  getOrganization(organizationId: number) {
    this.timeclockService.getOrganizationDetails(organizationId).subscribe({
      next: (data) => {
        this.organization = {
          ...data,
          projects: data.projects || []
        };
        console.log('Loading organization:', this.organization);
      },
      error: (err) => console.error('Failed to load organization: ', err)
    });

  }

}
