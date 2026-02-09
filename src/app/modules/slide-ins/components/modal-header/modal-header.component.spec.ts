import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnIconButtonHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { CloudSyncWizardComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.component';

describe('ModalHeader2Component', () => {
  let spectator: Spectator<ModalHeaderComponent>;
  let loader: HarnessLoader;
  const openSlideInsCounter = signal(1);
  const createComponent = createComponentFactory({
    component: ModalHeaderComponent,
    declarations: [
      MockComponent(CloudSyncWizardComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        getData: jest.fn((): undefined => undefined),
        swap: jest.fn(),
      }),
    ],
  });

  describe('Testing with one open slide-in', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          title: 'Add Cloudsync Task',
          loading: false,
        },
        providers: [
          mockProvider(SlideIn, {
            openSlideIns: openSlideInsCounter,
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows proper title', () => {
      const title = spectator.query('.ix-form-title')!;
      expect(title.textContent).toBe(' Add Cloudsync Task ');
    });

    it('shows a working close button when only 1 component is in the queue', async () => {
      const closeButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'close' }));
      await closeButton.click();
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: false });
      expect(await closeButton.getName()).toBe('close');
    });
  });

  describe('Testing with >1 open slide-ins', () => {
    beforeEach(() => {
      openSlideInsCounter.set(2);
      spectator = createComponent({
        props: {
          title: 'Add Cloudsync Task',
          loading: false,
        },
        providers: [
          mockProvider(SlideIn, {
            openSlideIns: openSlideInsCounter,
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });
    it('shows a working back button when more than 1 component is in the queue', async () => {
      spectator.detectChanges();
      const backButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'chevron-left' }));
      await backButton.click();
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: false });
      expect(await backButton.getName()).toBe('chevron-left');
    });
  });
});
