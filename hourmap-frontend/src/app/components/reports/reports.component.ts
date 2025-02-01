import { ChangeDetectorRef, Component } from '@angular/core';
import { PayrollObject } from '../../_models/payroll-object';
import { TimeclockService } from '../../_services/timeclock.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserTimeComponent } from "./user-time/user-time.component";
import { ProjectTimeComponent } from "./project-time/project-time.component";
import { TreasurePathBackgroundComponent } from '../treasure-path-background/treasure-path-background.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, UserTimeComponent, ProjectTimeComponent, TreasurePathBackgroundComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent {
  startDate: string = '';
  endDate: string = '';
  payrollReport: PayrollObject[] = [];
  _timeClockService: TimeclockService;
  activeTab: string = 'payroll-report';
  reportGenerated = false;

  constructor(private timeclockService: TimeclockService, private cdr: ChangeDetectorRef) {
    this._timeClockService = timeclockService;
  }

  onTabChange(tabId: string) {
    this.activeTab = tabId;
    this.cdr.detectChanges();
  }

  fetchReport() {
    this.timeclockService.getPayrollReport(this.startDate, this.endDate).subscribe({
      next: (report) => {
        this.payrollReport = report;
        console.log('Grabbed payroll:', report);
        this.reportGenerated = true;
      },
      error: (err) => {
        console.error('Failed to grab payroll report', err);
        this.reportGenerated = false;
      }
    });

  }

  exportToCSV() {
    const csv = [
      ['User', 'Total Hours', 'Payrate'],
      ...this.payrollReport.map(entry => [entry.userName, entry.totalHours.toFixed(2), entry.payRate.toFixed(2)])]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payroll_Report_${this.startDate}_${this.endDate}.csv`;
    a.click();
  }

}
