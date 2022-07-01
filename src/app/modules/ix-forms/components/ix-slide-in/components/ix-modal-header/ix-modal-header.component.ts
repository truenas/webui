import { Component, Input } from '@angular/core';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@Component({
  selector: 'ix-modal-header',
  templateUrl: './ix-modal-header.component.html',
  styleUrls: ['./ix-modal-header.component.scss'],
})
export class IxModalHeaderComponent {
  @Input() title: string;
  @Input() loading: boolean;
  @Input() disableClose = false;

  constructor(public slideInService: IxSlideInService) {}
}
