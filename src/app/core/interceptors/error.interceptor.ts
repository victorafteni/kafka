import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        errorMessage = `Client Error: ${error.error.message}`;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = 'Bad Request: The request was invalid.';
            break;
          case 401:
            errorMessage = 'Unauthorized: Please log in to continue.';
            break;
          case 403:
            errorMessage = 'Forbidden: You do not have permission to access this resource.';
            break;
          case 404:
            errorMessage = 'Resource not found.';
            break;
          case 409:
            errorMessage = 'Conflict: Resource state conflict.';
            break;
          case 500:
            errorMessage = 'Internal Server Error: Something failed on the server.';
            break;
          case 503:
            errorMessage = 'Service Unavailable: Server is temporarily overloaded.';
            break;
          default:
            errorMessage = `Error Code ${error.status}: ${error.message}`;
            break;
        }
      }

      console.error(`[HTTP ERROR ${error.status}]`, errorMessage, error);
      return throwError(() => new Error(errorMessage));
    })
  );
};

