import { ChangeDetectionStrategy, Component } from '@angular/core';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';

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

    it('does not throw when submit() is called', () => {
      expect(() => spectator.component.submit()).not.toThrow();
    });
  });
});
