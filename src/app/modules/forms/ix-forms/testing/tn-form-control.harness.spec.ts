import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import {
  TnCheckboxComponent, TnChipInputComponent, TnFormFieldComponent, TnInputComponent,
  TnRadioGroupComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { Option } from 'app/interfaces/option.interface';
import {
  IxFormControlHarness, unreadableControl,
} from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import {
  fillControlValues, getControlValues, getDisabledStates, indexControlsByLabel,
} from 'app/modules/forms/ix-forms/testing/control-harnesses.helpers';
import { TnFormControlHarness } from 'app/modules/forms/ix-forms/testing/tn-form-control.harness';

@Component({
  // An explicit selector keeps Angular from deriving the same component id as another
  // selector-less test component (NG0912).
  selector: 'ix-tn-form-control-test-host',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    TnChipInputComponent,
    TnRadioGroupComponent,
  ],
})
class HostComponent {
  readonly name = new FormControl('');
  readonly letter = new FormControl<string | null>(null);
  readonly enabled = new FormControl(false);
  readonly choice = new FormControl<string | null>(null);
  readonly tags = new FormControl<string[]>([]);

  readonly options: Option<string>[] = [
    { label: 'Alpha', value: 'a' },
    { label: 'Beta', value: 'b' },
  ];
}

describe('TnFormControlHarness', () => {
  let spectator: SpectatorHost<TnFormFieldComponent, HostComponent>;
  let loader: HarnessLoader;

  const createHost = createHostFactory({
    component: TnFormFieldComponent,
    host: HostComponent,
    imports: [
      ReactiveFormsModule,
      TnInputComponent,
      TnSelectComponent,
      TnCheckboxComponent,
      TnChipInputComponent,
      TnRadioGroupComponent,
    ],
  });

  // One field per supported control, plus a `tn-chip-input` the harness has no branch for. The
  // checkbox deliberately sits in a field with no label of its own, so `getLabelText`'s
  // self-labeling-control fallback is exercised too.
  beforeEach(() => {
    spectator = createHost(`
      <tn-form-field [label]="'Name'">
        <tn-input [formControl]="name"></tn-input>
      </tn-form-field>

      <tn-form-field [label]="'Letter'">
        <tn-select [formControl]="letter" [options]="options" [placeholder]="'Select'"></tn-select>
      </tn-form-field>

      <tn-form-field>
        <tn-checkbox [formControl]="enabled" [label]="'Enabled'"></tn-checkbox>
      </tn-form-field>

      <tn-form-field [label]="'Choice'">
        <tn-radio-group [formControl]="choice" [options]="options"></tn-radio-group>
      </tn-form-field>

      <tn-form-field [label]="'Tags'">
        <tn-chip-input [formControl]="tags"></tn-chip-input>
      </tn-form-field>
    `);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  async function getControls(): Promise<Record<string, IxFormControlHarness>> {
    return indexControlsByLabel(await loader.getAllHarnesses(TnFormControlHarness));
  }

  it('indexes every field by its label, falling back to a checkbox\'s own label', async () => {
    const labels = Object.keys(await getControls()).sort((a, b) => a.localeCompare(b));

    expect(labels).toEqual(['Choice', 'Enabled', 'Letter', 'Name', 'Tags']);
  });

  it('finds a self-naming control under the label the index files it under', async () => {
    const field = await loader.getHarness(TnFormControlHarness.with({ label: 'Enabled' }));

    // The wrapping field carries no label of its own — matching on the checkbox's own name is
    // exactly what the inherited `TnFormFieldHarness.with()` would miss.
    expect(await field.getLabel()).toBe('');
    expect(await field.getValue()).toBe(false);
  });

  describe('tn-input', () => {
    it('reads and writes the value', async () => {
      const control = (await getControls()).Name;
      await control.setValue('pool1');

      expect(spectator.hostComponent.name.value).toBe('pool1');
      expect(await control.getValue()).toBe('pool1');
    });

    it.each([['an empty string', ''], ['null', null]])('clears the field when set to %s', async (_label, value) => {
      const control = (await getControls()).Name;
      await control.setValue('pool1');

      // `TnInputHarness.setValue('')` would clear and then send zero keys, which the CDK rejects.
      await control.setValue(value);

      expect(spectator.hostComponent.name.value).toBe('');
      expect(await control.getValue()).toBe('');
    });

    it('reports the disabled state', async () => {
      expect(await (await getControls()).Name.isDisabled()).toBe(false);

      spectator.hostComponent.name.disable();
      spectator.detectChanges();

      expect(await (await getControls()).Name.isDisabled()).toBe(true);
    });
  });

  describe('tn-select', () => {
    it('reads an unpicked select as empty rather than as its placeholder', async () => {
      expect(await (await getControls()).Letter.getValue()).toBe('');
    });

    it('reads and writes the value by option label', async () => {
      const control = (await getControls()).Letter;
      await control.setValue('Beta');

      expect(spectator.hostComponent.letter.value).toBe('b');
      expect(await control.getValue()).toBe('Beta');
    });

    it('reports the disabled state', async () => {
      spectator.hostComponent.letter.disable();
      spectator.detectChanges();

      expect(await (await getControls()).Letter.isDisabled()).toBe(true);
    });

    it('reads the options it offers, addressed by the field label', async () => {
      const field = await loader.getHarness(TnFormControlHarness.with({ label: 'Letter' }));

      expect(await field.getSelectOptions()).toEqual(['Alpha', 'Beta']);
    });
  });

  describe('tn-checkbox', () => {
    it('reads and writes the checked state', async () => {
      const control = (await getControls()).Enabled;
      expect(await control.getValue()).toBe(false);

      await control.setValue(true);
      expect(spectator.hostComponent.enabled.value).toBe(true);
      expect(await control.getValue()).toBe(true);

      await control.setValue(false);
      expect(spectator.hostComponent.enabled.value).toBe(false);
    });

    it('reports the disabled state', async () => {
      spectator.hostComponent.enabled.disable();
      spectator.detectChanges();

      expect(await (await getControls()).Enabled.isDisabled()).toBe(true);
    });
  });

  describe('tn-radio', () => {
    it('reads the checked option label, and empty when nothing is picked', async () => {
      const control = (await getControls()).Choice;
      expect(await control.getValue()).toBe('');

      await control.setValue('Alpha');

      expect(spectator.hostComponent.choice.value).toBe('a');
      expect(await (await getControls()).Choice.getValue()).toBe('Alpha');
    });

    it('throws when no option carries the requested label', async () => {
      await expect((await getControls()).Choice.setValue('Gamma')).rejects.toThrow(
        'No radio option labelled "Gamma" in tn-form-field "Choice".',
      );
    });

    it('reports disabled only when every option is disabled', async () => {
      expect(await (await getControls()).Choice.isDisabled()).toBe(false);

      spectator.hostComponent.choice.disable();
      spectator.detectChanges();

      expect(await (await getControls()).Choice.isDisabled()).toBe(true);
    });
  });

  describe('unsupported control', () => {
    it('reads back as the unreadable sentinel instead of a made-up value', async () => {
      expect(await (await getControls()).Tags.getValue()).toBe(unreadableControl);
    });

    it('is left out of a whole-form read rather than reported as empty', async () => {
      const values = await getControlValues(await getControls());

      expect(values).not.toHaveProperty('Tags');
      expect(values).toHaveProperty('Name', '');
    });

    it('reads its disabled state back as the sentinel rather than as enabled', async () => {
      spectator.hostComponent.tags.disable();
      spectator.detectChanges();

      expect(await (await getControls()).Tags.isDisabled()).toBe(unreadableControl);
    });

    it('is left out of a whole-form disabled read rather than reported as enabled', async () => {
      spectator.hostComponent.tags.disable();
      spectator.detectChanges();

      const states = await getDisabledStates(await getControls());

      expect(states).not.toHaveProperty('Tags');
      expect(states).toHaveProperty('Name', false);
    });

    it('throws on setValue, naming the field', async () => {
      await expect((await getControls()).Tags.setValue('a')).rejects.toThrow(
        'tn-form-field "Tags" holds no control TnFormControlHarness can set',
      );
    });

    it('throws on getSelectOptions, naming the field', async () => {
      const field = await loader.getHarness(TnFormControlHarness.with({ label: 'Tags' }));

      await expect(field.getSelectOptions()).rejects.toThrow(
        'tn-form-field "Tags" holds no tn-select to read options from.',
      );
    });
  });
});

// A separate suite rather than a nested `describe`: the outer `beforeEach` instantiates the
// TestBed, and Spectator cannot build a second host template after that.
describe('TnFormControlHarness, label-less fields', () => {
  let spectator: SpectatorHost<TnFormFieldComponent, HostComponent>;
  let loader: HarnessLoader;

  const createHost = createHostFactory({
    component: TnFormFieldComponent,
    host: HostComponent,
    imports: [
      ReactiveFormsModule,
      TnInputComponent,
      TnSelectComponent,
      TnRadioGroupComponent,
    ],
  });

  // A radio group named only by `[ariaLabel]`, and a `tn-input` with no name at all.
  beforeEach(() => {
    spectator = createHost(`
      <tn-form-field>
        <tn-radio-group
          [formControl]="choice"
          [options]="options"
          [ariaLabel]="'Dispersal strategy'"
        ></tn-radio-group>
      </tn-form-field>

      <tn-form-field>
        <tn-input [formControl]="name"></tn-input>
      </tn-form-field>

      <tn-form-field [label]="'Letter'">
        <tn-select [formControl]="letter" [options]="options" [placeholder]="'Select'"></tn-select>
      </tn-form-field>
    `);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('indexes a radio group under its accessible name, and skips the control with no name', async () => {
    const controls = await indexControlsByLabel(await loader.getAllHarnesses(TnFormControlHarness));

    // The nameless input is dropped unconditionally — not only once a second nameless control
    // shows up — so whether a key resolves never depends on unrelated markup elsewhere.
    expect(Object.keys(controls).sort((a, b) => a.localeCompare(b)))
      .toEqual(['Dispersal strategy', 'Letter']);
  });

  it('explains the miss when a caller reaches for the empty label', async () => {
    const controls = await indexControlsByLabel(await loader.getAllHarnesses(TnFormControlHarness));

    await expect(fillControlValues(controls, { '': 'anything' })).rejects.toThrow(
      'No control is indexed under an empty label',
    );
  });
});
