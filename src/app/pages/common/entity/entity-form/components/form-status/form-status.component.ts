import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'form-status',
  templateUrl: './form-status.component.html',
  styleUrls: ['./form-status.component.css'],
})
export class FormStatusComponent {
  @Input() statusIcon = 'checkmark';
}
