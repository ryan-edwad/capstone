import { Injectable, inject } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

/**
 * Service to show and hide the spinner for loading
 */
@Injectable({
  providedIn: 'root'
})
export class BusyService {

  busyRequestCount = 0;
  private spinnerService = inject(NgxSpinnerService);

  /**
   * Show the spinner
   */
  busy() {
    this.busyRequestCount++;
    this.spinnerService.show(undefined, {
      type: 'timer',
      bdColor: 'rgba(255,255,255)',
      color: '#333333'
    })
  }

  /**
   * Hide the spinner
   */
  idle() {
    this.busyRequestCount--;
    if (this.busyRequestCount <= 0) {
      this.busyRequestCount = 0;
      this.spinnerService.hide();
    }
  }
}
