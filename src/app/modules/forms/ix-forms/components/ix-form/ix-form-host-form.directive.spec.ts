/* eslint-disable max-classes-per-file */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  defer, EMPTY, NEVER, Observable, of, throwError,
} from 'rxjs';
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
