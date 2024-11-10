import { Observable } from 'rxjs';

export interface SlideIn2CloseConfirmation {
  requiresConfirmationOnClose(): Observable<boolean>;
}
