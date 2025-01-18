import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from './_interceptors/token.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { errorInterceptor } from './_interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideHttpClient(withInterceptors([tokenInterceptor, errorInterceptor])), provideAnimationsAsync()]
};
