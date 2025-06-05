import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';

@Component({
  template: '',
  selector: 'ix-mock-slide-in',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockSlideInComponent {
  constructor(public slideInRef: SlideInRef<unknown, unknown>) {}
}
