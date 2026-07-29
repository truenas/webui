import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnFormFieldComponent, TnFormFieldHarness, TnInputComponent } from '@truenas/ui-components';
import { provideTnFormFieldErrors } from 'app/core/providers/tn-form-field-errors.provider';

@Component({
  selector: 'ix-test-host',
  template: `
    <tn-form-field label="Destination">
      <tn-input [formControl]="control"></tn-input>
    </tn-form-field>
  `,
  imports: [ReactiveFormsModule, TnFormFieldComponent, TnInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestHostComponent {
  readonly control = new FormControl('1');
}

describe('provideTnFormFieldErrors (integration with tn-form-field)', () => {
  let spectator: Spectator<TestHostComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: TestHostComponent,
    imports: [ReactiveFormsModule],
    providers: [provideTnFormFieldErrors()],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  // Reproduces the server-validation case from FormErrorHandlerService: the
  // field showed the raw `manualValidateError` key instead of the message.
  it('shows the server message, not the raw error key, for a manual validation error', async () => {
    // Touch first: the form field syncs its error state off `statusChanges`,
    // which `setErrors` emits but `markAsTouched` does not — so the touch must
    // already be in place when the errors land.
    spectator.component.control.markAsTouched();
    spectator.component.control.setErrors({
      manualValidateError: true,
      manualValidateErrorMsg: 'This field has the following error: invalid value.',
      ixManualValidateError: { message: 'This field has the following error: invalid value.' },
    });
    spectator.detectChanges();

    const field = await loader.getHarness(TnFormFieldHarness.with({ label: 'Destination' }));
    expect(await field.getErrorMessage()).toBe('This field has the following error: invalid value.');
  });
});
