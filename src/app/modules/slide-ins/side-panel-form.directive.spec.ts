/* eslint-disable max-classes-per-file */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';

@Component({ selector: 'ix-test-tracked-form', template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class TrackedFormComponent extends SidePanelForm {
  protected readonly form = new FormControl('');
  readonly loading = signal(false);
  readonly canSubmit = this.trackCanSubmit(this.loading);
  protected onSubmit(): void {}
}

@Component({ selector: 'ix-test-untracked-form', template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class UntrackedFormComponent extends SidePanelForm {
  protected readonly form = new FormControl('');
  readonly canSubmit = signal(true).asReadonly();
  protected onSubmit(): void {}
}

describe('SidePanelForm', () => {
  describe('isBusy (default, sourced from trackCanSubmit)', () => {
    let spectator: Spectator<TrackedFormComponent>;
    const createComponent = createComponentFactory(TrackedFormComponent);

    beforeEach(() => {
      spectator = createComponent();
    });

    it('reflects the loading signal handed to trackCanSubmit', () => {
      expect(spectator.component.isBusy()).toBe(false);

      spectator.component.loading.set(true);

      expect(spectator.component.isBusy()).toBe(true);
    });

    it('keeps canSubmit false while busy', () => {
      spectator.component.loading.set(true);

      expect(spectator.component.canSubmit()).toBe(false);
    });
  });

  describe('isSubmitting (distinguishes a save from an initial data load)', () => {
    let spectator: Spectator<TrackedFormComponent>;
    const createComponent = createComponentFactory(TrackedFormComponent);

    beforeEach(() => {
      spectator = createComponent();
    });

    it('stays false while busy with an initial data load (no submit yet)', () => {
      spectator.component.loading.set(true);

      expect(spectator.component.isBusy()).toBe(true);
      expect(spectator.component.isSubmitting()).toBe(false);
    });

    it('reads true once submit() has run and work is still in flight', () => {
      spectator.component.submit();
      spectator.component.loading.set(true);

      expect(spectator.component.isSubmitting()).toBe(true);
    });

    it('self-clears once the in-flight work settles', () => {
      spectator.component.submit();
      spectator.component.loading.set(true);
      expect(spectator.component.isSubmitting()).toBe(true);

      spectator.component.loading.set(false);

      expect(spectator.component.isSubmitting()).toBe(false);
    });

    it('drops the submit latch after a save, so a later non-submit busy toggle is not "saving"', () => {
      // Full save cycle: submit, then busy rises and falls (detectChanges flushes the reset effect).
      spectator.component.submit();
      spectator.component.loading.set(true);
      spectator.detectChanges();
      spectator.component.loading.set(false);
      spectator.detectChanges();

      // A later busy period with no submit (e.g. a reload) must not mislabel Save as "Saving…".
      spectator.component.loading.set(true);

      expect(spectator.component.isBusy()).toBe(true);
      expect(spectator.component.isSubmitting()).toBe(false);
    });
  });

  describe('isBusy (form that builds canSubmit without trackCanSubmit)', () => {
    let spectator: Spectator<UntrackedFormComponent>;
    const createComponent = createComponentFactory(UntrackedFormComponent);

    beforeEach(() => {
      spectator = createComponent();
    });

    it('stays false (such a form must override isBusy to wire its own loading source)', () => {
      expect(spectator.component.isBusy()).toBe(false);
    });
  });
});
