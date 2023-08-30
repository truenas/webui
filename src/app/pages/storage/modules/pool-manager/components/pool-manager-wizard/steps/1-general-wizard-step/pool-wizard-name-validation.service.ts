import { Injectable } from '@angular/core';
import {
  AbstractControl, ValidationErrors,
} from '@angular/forms';
import { Observable, catchError, debounceTime, distinctUntilChanged, of, switchMap, take } from 'rxjs';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({
  providedIn: 'root',
})
export class PoolWizardNameValidationService {
  constructor(
    private ws: WebSocketService,
  ) { }

  validatePoolName = (control: AbstractControl): Observable<ValidationErrors | null> => {
    return control.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      take(1),
      switchMap(value => {
        return this.ws.call('pool.validate_name', [value]).pipe(
          catchError(() => of({ invalidPoolName: true })),
          switchMap((isValid) => isValid === true ? of(null) : of({ invalidPoolName: true })),
        );
      }),

    );
  };
}
