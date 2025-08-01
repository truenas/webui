import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';

@Component({
  template: '',
  selector: 'ix-mock-slide-in',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockSlideInComponent {
  slideInRef = inject<SlideInRef<unknown, unknown>>(SlideInRef);
}
