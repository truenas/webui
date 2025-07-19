import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ix-mock-config-form',
  templateUrl: './mock-config-form.component.html',
  styleUrls: ['./mock-config-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockConfigFormComponent {}
