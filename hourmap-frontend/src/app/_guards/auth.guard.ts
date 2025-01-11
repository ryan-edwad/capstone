import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AccountService } from '../_services/account.service';


export const authGuard: CanActivateFn = (route, state) => {
  const accountService = inject(AccountService);
  const router = inject(Router);

  const roles = route?.data?.['roles'] as string[];
  const user = accountService.getTokenDecoded();

  console.log('Route allowed roles: ', roles);
  console.log('Decoded user from token: ', user);
  const schema = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

  if (user) {
    const userRoles = Array.isArray(user[schema])
      ? user[schema]
      : [user[schema]];

    console.log('User roles: ', userRoles);

    if (roles.some(role => userRoles.includes(role))) {
      return true;
    }
  }

  console.error('Unauthorized access or invalid roles', { roles, userRoles: user ? user[schema] : 'No roles found' });
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
}
