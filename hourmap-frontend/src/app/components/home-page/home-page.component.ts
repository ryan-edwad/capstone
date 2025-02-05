import { Component } from '@angular/core';
import { ClockBackgroundComponent } from "../clock-background/clock-background.component";
import { AccountService } from '../../_services/account.service';
import { Router } from '@angular/router';
/**
 * Component for the home page.
 */
@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [ClockBackgroundComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomePageComponent {
  constructor(private accountService: AccountService, private router: Router) { }

  startMapping() {
    if (this.accountService.isLoggedIn()) {
      this.router.navigate(['/timeclock']);
    }
    else {
      this.router.navigate(['/login']);
    }
  }

}
