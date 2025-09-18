import { Injectable, OnDestroy } from '@angular/core';
import { ReplaySubject } from 'rxjs';

export interface ValidationErrorEvent {
  fieldName: string;
}

@Injectable({ providedIn: 'root' })
export class ValidationErrorCommunicationService implements OnDestroy {
  private validationErrorSubject = new ReplaySubject<ValidationErrorEvent>(1);

  /**
   * Observable stream of validation errors for components to subscribe to
   */
  validationErrors$ = this.validationErrorSubject.asObservable();

  /**
   * Notify components about a validation error for a specific field
   * @param fieldName The name of the field with validation error
   */
  notifyValidationError(fieldName: string): void {
    this.validationErrorSubject.next({ fieldName });
  }

  /**
   * Cleanup resources when service is destroyed
   */
  ngOnDestroy(): void {
    this.validationErrorSubject.complete();
  }
}
