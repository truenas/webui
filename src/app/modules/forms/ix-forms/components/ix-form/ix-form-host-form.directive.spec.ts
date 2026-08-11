// Three host components are needed: one that renders no <ix-form> (fallback paths), and two that
// render a real one — one for the config-load state, one for the delegating submit paths.
/* eslint-disable max-classes-per-file */
import {
  ChangeDetectionStrategy, Component, inject, signal,
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, ReactiveFormsModule,
} from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  defer, EMPTY, NEVER, Observable, of, Subject, throwError,
} from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

/**
 * Concrete subclass whose template renders NO `<ix-form>`, so the `ixForm` view query stays
 * `undefined` — reproducing the pre-view-init window and exercising the base's fallback guards.
 */
@Component({
  selector: 'ix-test-form-host',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestFormHostComponent extends IxFormHostForm<boolean, { name: string }> {
  private fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    name: [''],
  });

  load(config$: Observable<{ name: string }>, patch?: (config: { name: string }) => void): void {
    this.loadFormConfig(config$, patch ?? ((config) => this.form.patchValue(config)));
  }

  readFormValue(): { name: string } {
    return this.form.getRawValue();
  }

  readSnapshot(): Partial<{ name: string }> | null {
    return this.initialFormSnapshot();
  }

  isLoading(): boolean {
    return this.dataLoading();
  }

  isFormPristine(): boolean {
    return this.form.pristine;
  }

  /** A `patch` that dirties the group — `setValue` on a control does, unlike `patchValue`. */
  markDirtyWhilePatching(config: { name: string }): void {
    this.form.controls.name.setValue(config.name);
    this.form.markAsDirty();
  }
}

/**
 * Renders a real `<ix-form>` carrying NO load-state bindings of its own — the shape every config
 * form now has. The load state has to reach the inner form through the base's view query alone.
 */
@Component({
  selector: 'ix-test-bound-form-host',
  template: '<ix-form [formGroup]="form" [submitHandler]="handleSubmit"></ix-form>',
  imports: [IxFormComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class BoundFormHostComponent extends IxFormHostForm<boolean, { name: string }> {
  private fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    name: [''],
  });

  protected handleSubmit = (): SubmitResult => ({
    request$: of(true),
    successMessage: 'Saved' as TranslatedString,
  });

  load(config$: Observable<{ name: string }>): void {
    this.loadFormConfig(config$, (config) => this.form.patchValue(config));
  }
}

/**
 * Wraps a real `<ix-form>`, so the delegating half of the base can be exercised. Separate from
 * {@link BoundFormHostComponent}: these tests need a submit held open mid-flight and a settable
 * `externalLoading`, where that one submits synchronously and drives its load state through
 * `loadFormConfig`.
 */
@Component({
  selector: 'ix-test-form-wrapper',
  // eslint-disable-next-line @angular-eslint/component-max-inline-declarations
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
  const createComponent = createComponentFactory({
    component: TestFormHostComponent,
    providers: [
      mockProvider(ErrorHandlerService),
    ],
  });

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

  describe('loadFormConfig', () => {
    it('patches the form and captures the snapshot the loaded values produce', () => {
      spectator.component.load(of({ name: 'loaded' }));

      expect(spectator.component.readFormValue()).toEqual({ name: 'loaded' });
      expect(spectator.component.readSnapshot()).toEqual({ name: 'loaded' });
      expect(spectator.component.isLoading()).toBe(false);
      expect(spectator.component.hasLoadFailed()).toBe(false);
    });

    it('leaves the form pristine, so a patching load never trips the unsaved-changes guard', () => {
      spectator.component.load(of({ name: 'loaded' }), (config) => {
        spectator.component.markDirtyWhilePatching(config);
      });

      expect(spectator.component.isFormPristine()).toBe(true);
    });

    it('reports the error and latches loadFailed when the load fails', () => {
      spectator.component.load(throwError(() => new Error('Failed to load config')));

      expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();
      expect(spectator.component.hasLoadFailed()).toBe(true);
      expect(spectator.component.isLoading()).toBe(false);
      // No snapshot, so `<ix-form>` never treats the untouched defaults as loaded values.
      expect(spectator.component.readSnapshot()).toBeNull();
    });

    it('reports the error and latches loadFailed when patching the loaded config throws', () => {
      spectator.component.load(of({ name: 'loaded' }), () => {
        throw new Error('Bad config');
      });

      expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();
      expect(spectator.component.hasLoadFailed()).toBe(true);
      expect(spectator.component.isLoading()).toBe(false);
      expect(spectator.component.readSnapshot()).toBeNull();
    });

    it('clears a latched failure when the load is retried', () => {
      spectator.component.load(throwError(() => new Error('Failed to load config')));
      expect(spectator.component.hasLoadFailed()).toBe(true);

      spectator.component.load(of({ name: 'loaded' }));

      expect(spectator.component.hasLoadFailed()).toBe(false);
      expect(spectator.component.readSnapshot()).toEqual({ name: 'loaded' });
    });

    it('clears dataLoading when the source completes without emitting', () => {
      spectator.component.load(EMPTY);

      expect(spectator.component.isLoading()).toBe(false);
      expect(spectator.component.hasLoadFailed()).toBe(false);
      expect(spectator.component.readSnapshot()).toBeNull();
    });

    it('patches from the first emission only, so a multi-emit source cannot overwrite user edits', () => {
      spectator.component.load(of({ name: 'first' }, { name: 'second' }));

      // Every caller passes a single-emit `api.call` today, but a second emission would re-run the
      // patch, re-capture the snapshot and mark the group pristine over whatever the user typed.
      expect(spectator.component.readFormValue()).toEqual({ name: 'first' });
      expect(spectator.component.readSnapshot()).toEqual({ name: 'first' });
    });

    it('drops the previous snapshot while a reload is in flight', () => {
      spectator.component.load(of({ name: 'loaded' }));
      expect(spectator.component.readSnapshot()).toEqual({ name: 'loaded' });

      spectator.component.load(NEVER);

      expect(spectator.component.readSnapshot()).toBeNull();
      expect(spectator.component.isLoading()).toBe(true);
    });
  });

  describe('retryLoad', () => {
    it('re-subscribes to the last load, so a transient failure can recover', () => {
      let attempt = 0;
      // Cold, like `ApiService.call`: each subscription is a fresh request. The first fails, the
      // retry succeeds.
      const config$ = defer(() => {
        attempt += 1;
        return attempt === 1 ? throwError(() => new Error('Failed to load config')) : of({ name: 'loaded' });
      });

      spectator.component.load(config$);
      expect(spectator.component.hasLoadFailed()).toBe(true);

      spectator.component.retryLoad();

      expect(attempt).toBe(2);
      expect(spectator.component.hasLoadFailed()).toBe(false);
      expect(spectator.component.readFormValue()).toEqual({ name: 'loaded' });
      expect(spectator.component.readSnapshot()).toEqual({ name: 'loaded' });
    });

    it('does nothing when no load has been started', () => {
      expect(() => spectator.component.retryLoad()).not.toThrow();
      expect(spectator.component.isLoading()).toBe(false);
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

// The load state reaching the inner <ix-form> is what actually blocks Save over defaults the user
// never saw, and it now travels through the base's view query rather than three template bindings
// a config form has to remember to write.
describe('IxFormHostForm load state', () => {
  let spectator: Spectator<BoundFormHostComponent>;

  const createComponent = createComponentFactory({
    component: BoundFormHostComponent,
    providers: [
      ...ixFormTestingProviders(),
      mockProvider(ErrorHandlerService),
    ],
  });

  async function settle(): Promise<void> {
    spectator.detectChanges();
    await spectator.fixture.whenStable();
  }

  it('hands the inner <ix-form> the captured snapshot, so changedValues has a baseline', async () => {
    spectator = createComponent();
    spectator.component.load(of({ name: 'loaded' }));
    await settle();

    // `isEdit` is inferred from the snapshot, so it only flips once the snapshot has landed.
    expect(spectator.query(IxFormComponent).isEdit()).toBe(true);
  });

  it('blocks submitting the inner <ix-form> while the load is in flight', async () => {
    spectator = createComponent();
    spectator.component.load(NEVER);
    await settle();

    expect(spectator.query(IxFormComponent).isLoading()).toBe(true);
    expect(spectator.query(IxFormComponent).canSubmit()).toBe(false);
    expect(spectator.component.canSubmit()).toBe(false);
  });

  it('blocks submitting the inner <ix-form> over defaults when the load fails', async () => {
    spectator = createComponent();
    spectator.component.load(throwError(() => new Error('Failed to load config')));
    await settle();

    expect(spectator.query(IxFormComponent).canSubmit()).toBe(false);
    expect(spectator.component.canSubmit()).toBe(false);
  });

  it('releases the inner <ix-form> once a retry succeeds', async () => {
    spectator = createComponent();
    spectator.component.load(throwError(() => new Error('Failed to load config')));
    await settle();

    spectator.component.load(of({ name: 'loaded' }));
    await settle();

    expect(spectator.query(IxFormComponent).canSubmit()).toBe(true);
    expect(spectator.component.canSubmit()).toBe(true);
  });
});
