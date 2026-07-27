import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { TnFormFieldComponent, TnRadioHarness } from '@truenas/ui-components';
import { Option } from 'app/interfaces/option.interface';
import {
  TnRadioGroupComponent,
} from 'app/modules/forms/ix-forms/components/tn-radio-group/tn-radio-group.component';

@Component({
  // An explicit selector keeps Angular from deriving the same component id as another
  // selector-less test component (NG0912).
  selector: 'ix-tn-radio-group-test-host',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TnRadioGroupComponent, TnFormFieldComponent],
})
class HostComponent {
  readonly control = new FormControl<string | null>('a');
  readonly options: Option<string>[] = [
    { label: 'Alpha', value: 'a' },
    { label: 'Beta', value: 'b' },
  ];
}

describe('TnRadioGroupComponent', () => {
  let spectator: SpectatorHost<TnRadioGroupComponent, HostComponent>;
  let loader: HarnessLoader;

  const createHost = createHostFactory({
    component: TnRadioGroupComponent,
    host: HostComponent,
    imports: [ReactiveFormsModule, TnFormFieldComponent],
  });

  // Set up per test rather than in a `beforeEach`: the nested describes render a different
  // template, and TestBed can't be reconfigured once the outer hook has instantiated it.
  function setup(template?: string): void {
    spectator = createHost(template ?? `
      <ix-tn-radio-group
        name="letter"
        [formControl]="control"
        [options]="options"
        [ariaLabel]="'Letter'"
        [testId]="['radio-button', 'letter']"
      ></ix-tn-radio-group>
    `);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  function getRadio(label: string): Promise<TnRadioHarness> {
    return loader.getHarness(TnRadioHarness.with({ label }));
  }

  it('renders a named radiogroup around the options', () => {
    setup();
    const group = spectator.query('[role="radiogroup"]');

    expect(group).toHaveAttribute('aria-label', 'Letter');
    expect(spectator.queryAll('tn-radio')).toHaveLength(2);
  });

  it('shows the control value as the checked option', async () => {
    setup();
    expect(await (await getRadio('Alpha')).isChecked()).toBe(true);
    expect(await (await getRadio('Beta')).isChecked()).toBe(false);
  });

  it('writes the picked option back to the bound control', async () => {
    setup();
    await (await getRadio('Beta')).check();

    expect(spectator.hostComponent.control.value).toBe('b');
  });

  it('re-renders the checked option after the control is reset to a previously picked value', async () => {
    setup();
    // The user picks Beta, so Alpha's `checked` field is left stale-true (Angular skips the
    // model->view write on the accessor that originated the change). Resetting to 'a' must still
    // render Alpha as checked.
    await (await getRadio('Beta')).check();
    spectator.hostComponent.control.setValue('a');
    spectator.detectChanges();

    expect(await (await getRadio('Alpha')).isChecked()).toBe(true);
    expect(await (await getRadio('Beta')).isChecked()).toBe(false);
  });

  it('does not emit the transient reset value to the bound control', async () => {
    setup();
    await (await getRadio('Beta')).check();

    const emitted: (string | null)[] = [];
    spectator.hostComponent.control.valueChanges.subscribe((value) => emitted.push(value));

    spectator.hostComponent.control.setValue('a');
    spectator.detectChanges();

    expect(emitted).toEqual(['a']);
  });

  it('disables every option when the control is disabled', async () => {
    setup();
    spectator.hostComponent.control.disable();
    spectator.detectChanges();

    expect(await (await getRadio('Alpha')).isDisabled()).toBe(true);
    expect(await (await getRadio('Beta')).isDisabled()).toBe(true);
  });

  it('composes a per-option test id from the base and the option label', () => {
    setup();
    expect(spectator.query('[data-test="radio-button-letter-alpha"]')).toExist();
    expect(spectator.query('[data-test="radio-button-letter-beta"]')).toExist();
  });

  describe('inside a labelled tn-form-field', () => {
    it('takes its accessible name from the field, so the label is not written twice', () => {
      setup(`
        <tn-form-field [label]="'Letter'">
          <ix-tn-radio-group name="letter" [formControl]="control" [options]="options"></ix-tn-radio-group>
        </tn-form-field>
      `);

      expect(spectator.query('[role="radiogroup"]')).toHaveAttribute('aria-label', 'Letter');
    });

    it('prefers an explicit ariaLabel over the field label', () => {
      setup(`
        <tn-form-field [label]="'Letter'">
          <ix-tn-radio-group
            name="letter"
            [formControl]="control"
            [options]="options"
            [ariaLabel]="'Pick a letter'"
          ></ix-tn-radio-group>
        </tn-form-field>
      `);

      expect(spectator.query('[role="radiogroup"]')).toHaveAttribute('aria-label', 'Pick a letter');
    });
  });
});
