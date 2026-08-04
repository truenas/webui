/* eslint-disable @angular-eslint/component-max-inline-declarations, max-classes-per-file */
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
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
 * Renders a real `<ix-form>`, so the base can see whether the load-state inputs made it across.
 * `bindLoadState` mirrors the binding a config form's template is supposed to carry — flipping it
 * off reproduces the template that forgot them.
 */
@Component({
  selector: 'ix-test-bound-form-host',
  template: `
    @if (bindLoadState()) {
      <ix-form
        [formGroup]="form"
        [externalLoading]="dataLoading()"
        [extraDisabled]="loadFailed()"
        [initialFormSnapshot]="initialFormSnapshot()"
        [submitHandler]="handleSubmit"
      ></ix-form>
    } @else {
      <ix-form [formGroup]="form" [submitHandler]="handleSubmit"></ix-form>
    }
  `,
  imports: [IxFormComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class BoundFormHostComponent extends IxFormHostForm<boolean, { name: string }> {
  private fb = inject(FormBuilder);

  readonly bindLoadState = input(true);

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

describe('IxFormHostForm load-state bindings', () => {
  let spectator: Spectator<BoundFormHostComponent>;
  let warn: jest.SpyInstance;

  const createComponent = createComponentFactory({
    component: BoundFormHostComponent,
    providers: [
      ...ixFormTestingProviders(),
      mockProvider(ErrorHandlerService),
    ],
  });

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    warn.mockRestore();
  });

  // The <ix-form> inputs, not the base's own signals: a form that never binds them keeps Save
  // enabled over defaults the user never saw, which is what the warning is there to surface.
  it('warns when a form that loads its config does not bind extraDisabled', async () => {
    spectator = createComponent({ props: { bindLoadState: false } });
    spectator.component.load(throwError(() => new Error('Failed to load config')));

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[extraDisabled]="loadFailed()"'));
  });

  it('warns when a form that loads its config does not bind initialFormSnapshot', async () => {
    spectator = createComponent({ props: { bindLoadState: false } });
    spectator.component.load(of({ name: 'loaded' }));

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[initialFormSnapshot]="initialFormSnapshot()"'));
  });

  it('stays quiet when the bindings are in place', async () => {
    spectator = createComponent();
    spectator.component.load(of({ name: 'loaded' }));
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    spectator.component.load(throwError(() => new Error('Failed to load config')));
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(warn).not.toHaveBeenCalled();
  });
});
