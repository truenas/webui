import { A11yModule } from '@angular/cdk/a11y';
import { ElementRef, Renderer2 } from '@angular/core';
import {
  fakeAsync, discardPeriodicTasks, tick,
} from '@angular/core/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import {
  Subject, of,
} from 'rxjs';
import { SlideIn2Component } from 'app/modules/slide-ins/components/slide-in2/slide-in2.component';
import { CloudSyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { ChainedComponentResponse, ChainedSlideInService } from 'app/services/chained-slide-in.service';

describe('IxSlideIn2Component', () => {
  const close$ = new Subject<ChainedComponentResponse>();
  let spectator: Spectator<SlideIn2Component>;
  const createComponent = createComponentFactory({
    component: SlideIn2Component,
    imports: [
      A11yModule,
    ],
    declarations: [
      MockComponent(CloudSyncFormComponent),
    ],
    providers: [
      mockProvider(ElementRef),
      mockProvider(Renderer2),
      mockProvider(ChainedSlideInService, {
        isTopComponentWide$: of(false),
        popComponent: jest.fn(),
        swapComponent: jest.fn(),
      }),
    ],
  });

  beforeAll(() => {
    Object.defineProperty(close$, 'next', {
      value: jest.fn(),
    });
    Object.defineProperty(close$, 'complete', {
      value: jest.fn(),
    });
  });

  function setupComponent(): void {
    spectator = createComponent({
      props: {
        componentInfo: {
          close$,
          component: CloudSyncFormComponent,
          id: 'id',
          data: undefined,
          isComponentAlive: true,
          wide: false,
        },
        index: 0,
        lastIndex: 0,
      },
    });
    tick(10);
  }

  it('close slide-in when backdrop is clicked', fakeAsync(() => {
    setupComponent();
    const backdrop = spectator.query('.ix-slide-in2-background');
    backdrop.dispatchEvent(new Event('click'));
    spectator.detectChanges();
    expect(close$.next).toHaveBeenCalledWith({ response: false, error: null });
    expect(close$.complete).toHaveBeenCalled();
    tick(305);
    expect(spectator.inject(ChainedSlideInService).popComponent).toHaveBeenCalledWith('id');
    discardPeriodicTasks();
  }));

  it('opens the slide in component', fakeAsync(() => {
    setupComponent();
    const form = spectator.query(CloudSyncFormComponent);
    expect(form).toExist();
  }));
});
