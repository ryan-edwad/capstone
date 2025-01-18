import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { catchError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  let hasRedirected = false;

  return next(req).pipe(
    catchError(error => {
      if (error) {
        switch (error.status) {
          case 400:
            if (error.error.errors) {
              const modalStateErrors = [];
              for (const key in error.error.errors) {
                if (error.error.errors[key]) {
                  modalStateErrors.push(error.error.errors[key])
                }
              }
              throw modalStateErrors.flat();
            }

            else {
              console.error(error.error, error.status)
            }
            break;
          case 401:
            if (!hasRedirected) {
              hasRedirected = true;
              console.error('Unauthorized', error.status);
              alert('Unauthorized. Redirecting to login.');
              router.navigateByUrl('/login').then(() => {
                hasRedirected = false;
              })
            }
            break;
          case 404:
            if (req.url.includes('timeentry')) {
              console.warn('404 Not found for:', req.url);
              break;
            }
            console.error('Not found', error.status);
            break;
          case 500:
            const navigationExtras: NavigationExtras = { state: { error: error.error } };
            console.error('Server error', navigationExtras);
            break;
          default:
            console.error('Something unexpected went wrong.');
            break;
        }
      }
      throw error;
    })
  );
};
