import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';

@Component({
  template: '',
  selector: 'ix-mock-slide-in2',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockSlideIn2Component {
  constructor(public slideInRef: SlideInRef<unknown, unknown>) {}
}
