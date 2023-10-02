import { Component, Inject, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { SLIDE_IN_CLOSER } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';

@Component({
  selector: 'ix-modal-header2',
  templateUrl: './ix-modal-header2.component.html',
  styleUrls: ['./ix-modal-header2.component.scss'],
})
export class IxModalHeader2Component {
  @Input() title: string;
  @Input() loading: boolean;
  @Input() disableClose = false;

  constructor(
    @Inject(SLIDE_IN_CLOSER) protected slideInCloser$: Subject<unknown>,
  ) {}

  close(): void {
    this.slideInCloser$.next(null);
  }
}
