import { HttpInterceptorFn } from '@angular/common/http';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('Intercepting request: ', req.url);
  const authToken = localStorage.getItem('authToken');

  const authReq = req.clone({
    setHeaders: {
      Authorization: authToken ? `Bearer ${authToken}` : ''
    }
  });

  console.log('Outgoing Request:', authReq);


  return next(authReq);
};
