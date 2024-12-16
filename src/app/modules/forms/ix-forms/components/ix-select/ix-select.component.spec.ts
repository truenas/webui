import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, tick } from '@angular/core/testing';
import {
  FormControl, ReactiveFormsModule,
} from '@angular/forms';
import {
  createHostFactory, SpectatorHost,
} from '@ngneat/spectator/jest';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Option, SelectOption } from 'app/interfaces/option.interface';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { IxSelectComponent } from './ix-select.component';

describe('IxSelectComponent', () => {
  let spectator: SpectatorHost<IxSelectComponent>;
  let loader: HarnessLoader;
  let control: FormControl<string>;
  let options$: Observable<Option[]>;
  const createHost = createHostFactory({
    component: IxSelectComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  describe('ix-select', () => {
    beforeEach(() => {
      control = new FormControl('');
      options$ = of([
        { label: 'GBR', value: 'Great Britain' },
        { label: 'GRL', value: 'Greenland' },
        { label: 'FRA', value: 'France' },
      ]);
      spectator = createHost(
        `<ix-select
          [formControl]="control"
          [label]="label"
          [required]="required"
          [tooltip]="tooltip"
          [options]="options"
          [showSelectAll]="showSelectAll"
        ></ix-select>`,
        {
          hostProps: {
            control,
            label: undefined,
            required: false,
            tooltip: undefined,
            options: undefined,
            showSelectAll: undefined,
          },
        },
      );
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      spectator.fixture.detectChanges();
    });

    it('disables MatSelect when form control is disabled', async () => {
      control.disable();
      spectator.component.setDisabledState(true);

      const select = await (await loader.getHarness(IxSelectHarness)).getSelectHarness();
      const state = await select.isDisabled();

      expect(state).toBe(true);
    });

    it('renders a label and passes properties to it', () => {
      spectator.setHostInput('label', 'Select Group');
      spectator.setHostInput('required', true);
      spectator.setHostInput('tooltip', 'Select group to use.');

      const label = spectator.query(IxLabelComponent);
      expect(label).toExist();
      expect(label.label()).toBe('Select Group');
      expect(label.required()).toBe(true);
      expect(label.tooltip()).toBe('Select group to use.');
    });

    it('shows loader while options are loading', fakeAsync(() => {
      const opt$ = options$.pipe(delay(100));
      spectator.setHostInput({ options: opt$ });

      expect(spectator.query('mat-progress-spinner')).toBeVisible();
      tick(100);
      spectator.detectChanges();

      expect(spectator.query('mat-progress-spinner')).not.toBeVisible();
    }));

    it('shows a list of options', async () => {
      spectator.setHostInput({ options: options$ });

      const select = await (await loader.getHarness(IxSelectHarness)).getSelectHarness();
      await select.open();
      const options = await select.getOptions();
      const optionLabels = await parallel(() => options.map((option) => option.getText()));
      expect(optionLabels).toEqual(['--', 'GBR', 'GRL', 'FRA']);
    });

    it('shows the current value in the select', async () => {
      spectator.setHostInput({ options: options$ });
      control.setValue('France');

      const select = await (await loader.getHarness(IxSelectHarness)).getSelectHarness();
      const currentValue = await select.getValueText();
      expect(currentValue).toBe('FRA');
    });

    it('writes values when option is selected from the dropdown', async () => {
      spectator.setHostInput({ options: options$ });

      const select = await (await loader.getHarness(IxSelectHarness)).getSelectHarness();
      await select.open();
      await select.clickOptions({ text: 'GBR' });
      expect(control.value).toBe('Great Britain');
    });

    it('shows \'No options\' if options length === 0', async () => {
      spectator.setHostInput('options', of<SelectOption[]>([]));
      spectator.component.ngOnChanges();

      const select = await (await loader.getHarness(IxSelectHarness)).getSelectHarness();
      await select.open();
      const options = await select.getOptions();
      const optionLabels = await parallel(() => options.map((option) => option.getText()));
      expect(optionLabels).toEqual(['No options']);
    });

    it('shows \'Options cannot be loaded\' if options has some error', async () => {
      jest.spyOn(console, 'error').mockImplementation();

      spectator.setHostInput('options', throwError(() => new Error('Some Error')));
      spectator.component.ngOnChanges();

      const select = await (await loader.getHarness(IxSelectHarness)).getSelectHarness();
      await select.open();
      const options = await select.getOptions();
      const optionLabels = await parallel(() => options.map((option) => option.getText()));
      expect(optionLabels).toEqual(['Options cannot be loaded']);
      expect(console.error).toHaveBeenCalled();
    });

    it('allows some options to be disabled', async () => {
      spectator.setHostInput('options', of([
        { label: 'GBR', value: 'Great Britain' },
        { label: 'GRL', value: 'Greenland', disabled: true },
      ]));

      spectator.component.ngOnChanges();

      const select = await (await loader.getHarness(IxSelectHarness)).getSelectHarness();
      await select.open();
      const options = await select.getOptions();
      expect(await options[1].isDisabled()).toBe(false);
      expect(await options[2].getText()).toBe('GRL');
      expect(await options[2].isDisabled()).toBe(true);
    });

    it('shows options tooltip if it is provided', async () => {
      spectator.setHostInput('options', of([
        { label: 'GBR', value: 'Great Britain' },
        { label: 'GRL', value: 'Greenland', tooltip: 'Not really green.' },
      ]));
      spectator.component.ngOnChanges();

      const select = await (await loader.getHarness(IxSelectHarness)).getSelectHarness();
      await select.open();

      const tooltips = spectator.queryAll(TooltipComponent);
      expect(tooltips).toHaveLength(1);
      expect(tooltips[0].message()).toBe('Not really green.');
    });
  });

  describe('select multiple', () => {
    beforeEach(() => {
      options$ = of([
        { label: 'GBR', value: 'Great Britain' },
        { label: 'GRL', value: 'Greenland' },
        { label: 'FRA', value: 'France' },
      ]);
      control = new FormControl('');
      spectator = createHost(
        '<ix-select [formControl]="control" [multiple]="true" [options]="options$"></ix-select>',
        { hostProps: { control, options$ } },
      );
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      spectator.fixture.detectChanges();
    });

    it('multiple values must be selected if \'multiple\' is true', async () => {
      const select = await loader.getHarness(IxSelectHarness);
      const matSelect = await select.getSelectHarness();

      await matSelect.open();
      await matSelect.clickOptions({ text: 'GBR' });
      await matSelect.clickOptions({ text: 'GRL' });

      expect(await select.getValue()).toEqual(['GBR', 'GRL']);
      expect(control.value).toEqual(['Great Britain', 'Greenland']);
    });

    it('should select all options when "Select All" is checked', async () => {
      spectator.setHostInput('showSelectAll', true);
      const select = await loader.getHarness(IxSelectHarness);
      await select.selectAll();

      expect(control.value).toEqual(['Great Britain', 'Greenland', 'France']);
      expect(await select.getValue()).toEqual(['GBR', 'GRL', 'FRA']);
    });

    it('should unselect all options when "Select All" is unchecked', async () => {
      spectator.setHostInput('showSelectAll', true);

      const select = await loader.getHarness(IxSelectHarness);
      await select.unselectAll();

      expect(control.value).toBe('');
      expect(await select.getValue()).toEqual([]);
    });
  });
});
