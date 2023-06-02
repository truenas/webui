import {
  Component, ElementRef, Inject,
} from '@angular/core';
import { fakeAsync } from '@angular/core/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { IxSlideInComponent } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.component';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';

/** Simple component for testing IxSlideInComponent */
@Component({
  template: '<h1>{{text}}</h1>',
})
class TestClassComponent {
  text: string;
  constructor(
  @Inject(SLIDE_IN_DATA) value: string,
  ) {
    this.text = value;
  }
}

describe('IxSlideInComponent', () => {
  let spectator: Spectator<IxSlideInComponent>;

  const createComponent = createComponentFactory({
    component: IxSlideInComponent,
    declarations: [
      TestClassComponent,
    ],
    providers: [
      mockProvider(ElementRef, {
        nativeElement: {} as HTMLElement,
      }),

    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.inject(ElementRef);
  });

  it('call \'openSlideIn\' should create a host element in the body of the slide', () => {
    spectator.component.openSlideIn(TestClassComponent, { wide: true, data: 'Component created dynamically' });
    const dynamicElement: HTMLElement = (spectator.debugElement.nativeElement as Element).querySelector('h1');
    spectator.fixture.detectChanges();

    expect(dynamicElement).toHaveText('Component created dynamically');
  });

  it('call \'closeSlideIn\' should remove a created host element after 200ms', fakeAsync(() => {
    spectator.component.openSlideIn(
      TestClassComponent,
      { wide: true, data: 'Component created dynamically' },
    );
    spectator.component.closeSlideIn();

    spectator.tick(200);
    const dynamicElement: HTMLElement = (spectator.debugElement.nativeElement as Element).querySelector('.ix-slide-in-body');
    expect(dynamicElement).toBeEmpty();
  }));
});
