import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnIconButtonComponent, TnIconButtonHarness, TnProgressBarComponent,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
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
      mockProvider(SlideInRef, { close: jest.fn() }),
      mockProvider(SlideIn, { openSlideIns: openSlideInsCounter }),
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
      // The title bar is plain markup, not a tn-* component, so there is no harness for it.
      // Pinned to `h2` so a silent heading-level regression fails here.
      expect(spectator.query('h2.ix-form-title')!.textContent!.trim()).toBe('Add Cloudsync Task');
    });

    it('shows a working close button when only 1 component is in the queue', async () => {
      const closeButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'close' }));
      await closeButton.click();

      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: undefined });
    });

    it('does not render the back button when nothing is underneath', async () => {
      expect(await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'chevron-left' }))).toHaveLength(0);
    });

    it('names the close control after the form and explains what it does', () => {
      // White-box reads of signal inputs: TnIconButtonHarness exposes no getAriaLabel()/getTooltip().
      const closeButton = spectator.query(TnIconButtonComponent)!;

      expect(closeButton.ariaLabel()).toBe('Close Add Cloudsync Task Form');
      expect(closeButton.tooltip()).toBe('Close the form');
    });

    it('does not render a close control when close is disabled', async () => {
      spectator.setInput('disableClose', true);

      expect(await loader.getAllHarnesses(TnIconButtonHarness)).toHaveLength(0);
    });

    it('does not show a progress bar when not loading', () => {
      expect(spectator.query(TnProgressBarComponent)).toBeNull();
    });

    it('shows an indeterminate progress bar while loading', () => {
      spectator.setInput('loading', true);

      // White-box read: the library ships no TnProgressBarHarness in 0.4.11.
      const progressBar = spectator.query(TnProgressBarComponent)!;
      expect(progressBar.mode()).toBe('indeterminate');
      expect(progressBar.ariaLabel()).toBe('Loading');
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

    it('explains that the back button returns to the previous form', () => {
      expect(spectator.query(TnIconButtonComponent)!.tooltip()).toBe('Go back to the previous form');
    });
  });

  describe('without the required roles', () => {
    beforeEach(() => {
      openSlideInsCounter.set(1);
      spectator = createComponent({
        props: { title: 'Add Cloudsync Task' },
      });
      // `MockAuthService.hasRole` is a hardcoded `of(true)`; override the spy so the argument the
      // component passes stays assertable.
      const authService = spectator.inject(AuthService) as unknown as MockAuthService;
      authService.hasRole.mockReturnValue(of(false));
      spectator.setInput('requiredRoles', [Role.FullAdmin]);
    });

    it('shows the readonly badge, checking the roles the form declared', () => {
      const authService = spectator.inject(AuthService) as unknown as MockAuthService;

      expect(spectator.query('ix-readonly-badge')).not.toBeNull();
      expect(authService.hasRole).toHaveBeenCalledWith([Role.FullAdmin]);
    });
  });
});
