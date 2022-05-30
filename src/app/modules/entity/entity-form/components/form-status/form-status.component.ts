import { Component, Input } from '@angular/core';

@Component({
  templateUrl: './form-status.component.html',
  styleUrls: ['./form-status.component.scss'],
})
export class FormStatusComponent {
  @Input() statusIcon = 'checkmark';
}
