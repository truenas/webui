import { Component, Input } from '@angular/core';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';

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
    private slideInRef: IxSlideInRef<IxModalHeaderComponent>,
  ) {}

  close(): void {
    this.slideInRef.close();
  }
}
