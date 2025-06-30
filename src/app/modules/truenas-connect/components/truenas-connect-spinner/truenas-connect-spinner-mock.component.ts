import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ix-truenas-connect-spinner',
  standalone: true,
  template: '<div class="mock-spinner" data-testid="mock-spinner">Loading...</div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockTruenasConnectSpinnerComponent {}
