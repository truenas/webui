/* eslint-disable @angular-eslint/component-max-inline-declarations, max-classes-per-file */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { Subject } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';

/**
 * Concrete subclass whose template renders NO `<ix-form>`, so the `ixForm` view query stays
 * `undefined` — reproducing the pre-view-init window and exercising the base's fallback guards.
 */
@Component({
  selector: 'ix-test-form-host',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestFormHostComponent extends IxFormHostForm {}

/** Wraps a real `<ix-form>`, so the delegating half of the base can be exercised. */
@Component({
  selector: 'ix-test-form-wrapper',
  template: `
    <ix-form
      [formGroup]="form"
      [externalLoading]="externalLoading()"
      [submitHandler]="handleSubmit"
      (closed)="closed.emit($event)"
    ></ix-form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IxFormComponent],
})
class TestFormWrapperComponent extends IxFormHostForm {
  /** Held open so a submit can be observed mid-flight, then completed by the test. */
  readonly request$ = new Subject<boolean>();

  protected readonly form = new FormGroup({ name: new FormControl('') });
  protected readonly externalLoading = signal(false);
  protected handleSubmit = (): SubmitResult => ({ request$: this.request$, successMessage: 'Saved.' });

  setExternalLoading(loading: boolean): void {
    this.externalLoading.set(loading);
  }
}

describe('IxFormHostForm', () => {
  let spectator: Spectator<TestFormHostComponent>;
  const createComponent = createComponentFactory(TestFormHostComponent);

  beforeEach(() => {
    spectator = createComponent();
  });

  describe('before the inner <ix-form> renders', () => {
    it('reports canSubmit() as false', () => {
      expect(spectator.component.canSubmit()).toBe(false);
    });

    it('reports hasUnsavedChanges() as false', () => {
      expect(spectator.component.hasUnsavedChanges()).toBe(false);
    });

    it('reports isBusy() as false', () => {
      expect(spectator.component.isBusy()).toBe(false);
    });

    it('reports isSubmitting() as false', () => {
      expect(spectator.component.isSubmitting()).toBe(false);
    });

    it('does not throw when submit() is called', () => {
      expect(() => spectator.component.submit()).not.toThrow();
    });
  });

  describe('with an inner <ix-form>', () => {
    let wrapper: Spectator<TestFormWrapperComponent>;
    const createWrapper = createComponentFactory({
      component: TestFormWrapperComponent,
      providers: [mockAuth(), ...ixFormTestingProviders()],
    });

    beforeEach(() => {
      wrapper = createWrapper();
    });

    // The `<tn-side-panel>` footer reads this to swap Save for "Saving…", so it must track the
    // inner form's submit-only signal rather than `isLoading()` (which also covers setup fetches).
    // Driven through a real submit rather than by poking the signal, so the wiring is covered too:
    // if `onFormSubmit` stopped setting `isSubmitting`, poking it directly would still pass.
    it('reports isSubmitting() for the duration of a real submit', () => {
      expect(wrapper.component.isSubmitting()).toBe(false);

      wrapper.component.submit();

      expect(wrapper.component.isSubmitting()).toBe(true);

      wrapper.component.request$.next(true);
      wrapper.component.request$.complete();

      expect(wrapper.component.isSubmitting()).toBe(false);
    });

    // The whole reason isSubmitting() exists apart from isBusy(): a form fetching its initial
    // config is busy, but Save must still read "Save", not "Saving…".
    it('stays false while the form is only loading its initial data', () => {
      wrapper.component.setExternalLoading(true);
      wrapper.detectChanges();

      expect(wrapper.component.isBusy()).toBe(true);
      expect(wrapper.component.isSubmitting()).toBe(false);
    });
  });
});
