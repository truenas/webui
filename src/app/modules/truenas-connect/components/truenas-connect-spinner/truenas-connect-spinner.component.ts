import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ix-truenas-connect-spinner',
  standalone: true,
  templateUrl: './truenas-connect-spinner.component.html',
  styleUrl: './truenas-connect-spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruenasConnectSpinnerComponent {}
