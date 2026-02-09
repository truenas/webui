import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RebootInfoDialogSuppressionService {
  private readonly suppressed = signal(false);

  readonly isSuppressed = this.suppressed.asReadonly();

  suppress(): void {
    this.suppressed.set(true);
  }

  unsuppress(): void {
    this.suppressed.set(false);
  }
}
