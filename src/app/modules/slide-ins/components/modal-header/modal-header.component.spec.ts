import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnIconButtonHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';

describe('ModalHeaderComponent', () => {
  let spectator: Spectator<ModalHeaderComponent>;
  let loader: HarnessLoader;
  const openSlideInsCounter = signal(1);
  const createComponent = createComponentFactory({
    component: ModalHeaderComponent,
    providers: [
      mockAuth(),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        getData: jest.fn((): undefined => undefined),
        swap: jest.fn(),
      }),
      mockProvider(SlideIn, {
        openSlideIns: openSlideInsCounter,
      }),
    ],
  });

  describe('with one open slide-in', () => {
    beforeEach(() => {
      openSlideInsCounter.set(1);
      spectator = createComponent({
        props: {
          title: 'Add Cloudsync Task',
          loading: false,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows proper title', () => {
      // No `TnSidePanelHarness` equivalent for the legacy header, so the title is read off the DOM.
      expect(spectator.query('.ix-form-title')!.textContent!.trim()).toBe('Add Cloudsync Task');
    });

    it('shows a working close button when only 1 component is in the queue', async () => {
      const closeButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'close' }));
      await closeButton.click();

      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: undefined });
    });

    it('gives the close button an accessible name naming the form', () => {
      expect(spectator.query('tn-icon-button button')).toHaveAttribute(
        'aria-label',
        'Close Add Cloudsync Task Form',
      );
    });

    it('does not show a progress bar when not loading', () => {
      expect(spectator.query('[role="progressbar"]')).toBeNull();
    });

    it('shows an indeterminate progress bar while loading', () => {
      spectator.setInput('loading', true);

      const progressBar = spectator.query('[role="progressbar"]')!;
      expect(progressBar).toHaveClass('tn-progress-bar-indeterminate');
      expect(progressBar).toHaveAttribute('aria-label', 'Loading');
    });

    it('does not show the readonly badge when the user has the required roles', () => {
      spectator.setInput('requiredRoles', [Role.FullAdmin]);

      expect(spectator.query('ix-readonly-badge')).toBeNull();
    });
  });

  describe('with >1 open slide-ins', () => {
    beforeEach(() => {
      openSlideInsCounter.set(2);
      spectator = createComponent({
        props: {
          title: 'Add Cloudsync Task',
          loading: false,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows a working back button when more than 1 component is in the queue', async () => {
      const backButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'chevron-left' }));
      await backButton.click();

      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: undefined });
    });

    it('does not render the dismiss button alongside the back button', async () => {
      expect(await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'close' }))).toHaveLength(0);
    });
  });

  describe('without the required roles', () => {
    beforeEach(() => {
      openSlideInsCounter.set(1);
      spectator = createComponent({
        props: {
          title: 'Add Cloudsync Task',
          requiredRoles: [Role.FullAdmin],
        },
        providers: [
          mockProvider(AuthService, { hasRole: () => of(false) }),
        ],
      });
    });

    it('shows the readonly badge', () => {
      expect(spectator.query('ix-readonly-badge')).not.toBeNull();
    });
  });
});
