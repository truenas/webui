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
