import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap, finalize } from 'rxjs';
import { TelemetryService } from '../services/telemetry.service';

export const telemetryInterceptor: HttpInterceptorFn = (req, next) => {
  const telemetry = inject(TelemetryService);
  const startTime = performance.now();
  let isError = false;

  return next(req).pipe(
    tap({
      error: () => {
        isError = true;
      }
    }),
    finalize(() => {
      const duration = Math.round(performance.now() - startTime);
      telemetry.recordApiRequest(duration, isError);
    })
  );
};

