import { Component, Input } from '@angular/core';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { IxSlideIn2Service } from 'app/services/ix-slide-in2.service';

@Component({
  selector: 'ix-modal-header',
  templateUrl: './ix-modal-header.component.html',
  styleUrls: ['./ix-modal-header.component.scss'],
})
export class IxModalHeaderComponent {
  @Input() title: string;
  @Input() loading: boolean;
  @Input() disableClose = false;

  constructor(
    public slideInService: IxSlideInService,
    private slideIn2Service: IxSlideIn2Service,
  ) {}

  close(): void {
    this.slideInService.close();
    this.slideIn2Service.closeLast();
  }
}
