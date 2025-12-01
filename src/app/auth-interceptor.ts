import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './services/auth-service';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

export function authInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn) {
  const token = inject(AuthService).getToken();
  const router = inject(Router);
  const auth = inject(AuthService);

  if (token) {
    request = request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  } else {
    console.log('No token found');
   }

  return next(request).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401) {
          auth.clearToken();
          router.navigate(['/login'], {
            queryParams: { redirect: router.routerState.snapshot.url },
          });
        }
      }
      return throwError(() => err);
    })
  );
}
