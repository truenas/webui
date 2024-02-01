import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit, ChangeDetectionStrategy, Component, Inject, Input,
} from '@angular/core';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';

@Component({
  selector: 'ix-modal-header',
  templateUrl: './ix-modal-header.component.html',
  styleUrls: ['./ix-modal-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxModalHeaderComponent implements AfterViewInit {
  @Input() title: string;
  @Input() loading: boolean;
  @Input() disableClose = false;

  constructor(
    private slideInRef: IxSlideInRef<IxModalHeaderComponent>,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngAfterViewInit(): void {
    this.document.getElementById('ix-close-icon')?.focus();
  }

  close(): void {
    this.slideInRef.close();
  }
}
