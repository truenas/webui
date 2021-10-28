import { Component, Input } from '@angular/core';
import { IxModalService } from 'app/services/ix-modal.service';

@Component({
  selector: 'ix-modal-header',
  templateUrl: './ix-modal-header.component.html',
  styleUrls: ['./ix-modal-header.component.scss'],
})
export class IxModalHeaderComponent {
  @Input() title: string;
  @Input() loading: boolean;

  constructor(public modal: IxModalService) {}
}
