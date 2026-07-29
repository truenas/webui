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

  // Values that all collapse to the same string: two distinct objects (`[object Object]`)
  // and a number/string pair that both render as `1`.
  readonly ambiguousControl = new FormControl<unknown>(null);
  readonly ambiguousOptions: Option<unknown>[] = [
    { label: 'First', value: { id: 1 } },
    { label: 'Second', value: { id: 2 } },
    { label: 'Number', value: 1 },
    { label: 'String', value: '1' },
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

  it('keeps focus inside the group when a model write recreates the options', () => {
    setup();
    const alpha = spectator.query('tn-radio input[value="a"]') as HTMLInputElement;
    alpha.focus();

    spectator.hostComponent.control.setValue('b');
    spectator.detectChanges();

    // The radios are destroyed and recreated, so the focused element is a new node — assert on
    // what the user perceives (focus is on the now-checked option) rather than on node identity.
    const focused = document.activeElement as HTMLInputElement;

    expect(focused).not.toBe(document.body);
    expect(focused.value).toBe('b');
    expect(focused.checked).toBe(true);
  });

  it('does not move focus when the group did not have it', () => {
    setup();
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();

    spectator.hostComponent.control.setValue('b');
    spectator.detectChanges();

    expect(document.activeElement).toBe(outside);
    outside.remove();
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

  it('stacks the options by default', () => {
    setup();

    expect(spectator.query('[role="radiogroup"]')).not.toHaveClass('inline');
  });

  it('lays the options out in a row when inline', () => {
    setup(`
      <ix-tn-radio-group
        name="letter"
        [formControl]="control"
        [options]="options"
        [inline]="true"
      ></ix-tn-radio-group>
    `);

    expect(spectator.query('[role="radiogroup"]')).toHaveClass('inline');
  });

  it('gives each rendered group its own native name so two never fuse into one', () => {
    setup(`
      <ix-tn-radio-group name="letter" [formControl]="control" [options]="options"></ix-tn-radio-group>
      <ix-tn-radio-group name="letter" [formControl]="control" [options]="options"></ix-tn-radio-group>
    `);

    // From the fixture, not `spectator.queryAll` — the latter is scoped to the first group.
    const inputs = spectator.fixture.nativeElement.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>;
    const names = Array.from(inputs).map((input) => input.name);

    expect(new Set(names)).toHaveProperty('size', 2);
    expect(names.every((name) => name.startsWith('letter-'))).toBe(true);
  });

  it('composes a per-option test id from the base and the option label', () => {
    setup();
    expect(spectator.query('[data-test="radio-button-letter-alpha"]')).toExist();
    expect(spectator.query('[data-test="radio-button-letter-beta"]')).toExist();
  });

  describe('options whose values stringify alike', () => {
    // The `@for` track key used to be `${renderKey}-${String(option.value)}`, which collides for
    // any two objects and for `1` vs `'1'`. Angular rejects duplicate keys (NG0955) and the group
    // renders broken — so this covers the object/array-valued options `writeValue` documents.
    function setupAmbiguous(): void {
      setup(`
        <ix-tn-radio-group
          name="ambiguous"
          [formControl]="ambiguousControl"
          [options]="ambiguousOptions"
          [ariaLabel]="'Ambiguous'"
        ></ix-tn-radio-group>
      `);
    }

    it('renders every option', () => {
      setupAmbiguous();

      expect(spectator.queryAll('tn-radio')).toHaveLength(4);
    });

    it('keeps each option independently selectable', async () => {
      setupAmbiguous();
      await (await getRadio('Second')).check();

      expect(spectator.hostComponent.ambiguousControl.value)
        .toBe(spectator.hostComponent.ambiguousOptions[1].value);
      expect(await (await getRadio('First')).isChecked()).toBe(false);
      expect(await (await getRadio('Second')).isChecked()).toBe(true);
    });
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

    it('omits aria-label entirely when neither the field nor the group names it', () => {
      setup(`
        <tn-form-field>
          <ix-tn-radio-group name="letter" [formControl]="control" [options]="options"></ix-tn-radio-group>
        </tn-form-field>
      `);

      // Not aria-label="", which would read as named to a DOM check but not to a screen reader.
      expect(spectator.query('[role="radiogroup"]')).not.toHaveAttribute('aria-label');
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
