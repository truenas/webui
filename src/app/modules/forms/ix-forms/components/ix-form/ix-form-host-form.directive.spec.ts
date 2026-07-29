import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Observable, of, throwError } from 'rxjs';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
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
class TestFormHostComponent extends IxFormHostForm {
  private fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    name: [''],
  });

  load(config$: Observable<{ name: string }>): void {
    this.loadFormConfig(config$, (config) => this.form.patchValue(config));
  }

  readSnapshot(): Partial<{ name: string }> | null {
    return this.initialFormSnapshot();
  }

  isLoading(): boolean {
    return this.dataLoading();
  }

  hasLoadFailed(): boolean {
    return this.loadFailed();
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

      expect(spectator.component.form.getRawValue()).toEqual({ name: 'loaded' });
      expect(spectator.component.readSnapshot()).toEqual({ name: 'loaded' });
      expect(spectator.component.isLoading()).toBe(false);
      expect(spectator.component.hasLoadFailed()).toBe(false);
    });

    it('reports the error and latches loadFailed when the load fails', () => {
      spectator.component.load(throwError(() => new Error('Failed to load config')));

      expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();
      expect(spectator.component.hasLoadFailed()).toBe(true);
      expect(spectator.component.isLoading()).toBe(false);
      // No snapshot, so `<ix-form>` never treats the untouched defaults as loaded values.
      expect(spectator.component.readSnapshot()).toBeNull();
    });
  });
});
