import { Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ix-warning',
  templateUrl: './ix-warning.component.html',
  styleUrls: ['./ix-warning.component.scss'],
})
export class IxWarningComponent {
  @Input() message: string;
}
