import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ValidationErrorEvent {
  fieldName: string;
}

@Injectable({ providedIn: 'root' })
export class ValidationErrorCommunicationService {
  private validationErrorSubject = new Subject<ValidationErrorEvent>();

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
}
