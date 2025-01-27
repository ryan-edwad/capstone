import { Component, ChangeDetectorRef } from '@angular/core';
import { AccountService } from '../../_services/account.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css'
})
export class NavComponent {
  isLoggedIn = false;
  isManagerOrAdmin = false;
  userName = '';
  navLink = '/';

  constructor(private accountService: AccountService,
    private router: Router,
    private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        console.log('Navigation ended, updating nav stat...');
        this.updateNavState();
      })
    this.accountService.isAuthenticated.subscribe((loggedIn) => {
      console.log('Auth State Changed:', loggedIn);
      this.isLoggedIn = loggedIn;
      this.cdr.detectChanges();
      this.updateNavState();
    });
    this.updateNavState();

  }

  updateNavState() {
    const token = this.accountService.getTokenDecoded();
    if (!token) {
      this.isLoggedIn = false;
      this.isManagerOrAdmin = false;
      this.userName = '';
      return;
    }

    this.isLoggedIn = true;
    const schema = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    this.isManagerOrAdmin = token ? ['Manager', 'Admin'].includes(token[schema]) : false;

    const givenName = token['given_name'] || '';
    const familyName = token['family_name'] || '';
    this.userName = `${givenName} ${familyName}`.trim() || token['name'];
    this.navLink = this.isManagerOrAdmin
      ? '/organization-dashboard'
      : '/timeclock';
  }

  logLinkClick(link: string) {
    console.log(`Navigating to: ${link}`);
  }

  logOut() {
    this.accountService.logout();
    this.router.navigate(['/login']);
  }
}
