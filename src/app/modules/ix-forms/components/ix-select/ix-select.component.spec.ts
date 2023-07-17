import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  FormControl, FormsModule, NgControl, ReactiveFormsModule,
} from '@angular/forms';
import { MatSelectHarness } from '@angular/material/select/testing';
import {
  createHostFactory,
  Spectator,
  mockProvider,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Option, SelectOption } from 'app/interfaces/option.interface';
import { IxErrorsComponent } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/ix-forms/components/ix-label/ix-label.component';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { IxSelectComponent } from './ix-select.component';

describe('IxSelectComponent', () => {
  let spectator: Spectator<IxSelectComponent>;
  let loader: HarnessLoader;
  let control: FormControl<string>;
  let options$: Observable<Option[]>;
  const createHost = createHostFactory({
    component: IxSelectComponent,
    imports: [
      ReactiveFormsModule,
      FormsModule,
    ],
    providers: [
      mockProvider(NgControl),
    ],
    declarations: [
      MockComponent(IxErrorsComponent),
      MockComponent(IxLabelComponent),
      MockComponent(TooltipComponent),
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
        '<ix-select [formControl]="control"></ix-select>',
        { hostProps: { control } },
      );
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      spectator.fixture.detectChanges();
    });

    it('disables MatSelect when form control is disabled', async () => {
      control.disable();
      spectator.component.setDisabledState(true);

      const select = await loader.getHarness(MatSelectHarness);
      const state = await select.isDisabled();

      expect(state).toBe(true);
    });

    it('renders a label and passes properties to it', () => {
      spectator.setInput('label', 'Select Group');
      spectator.setInput('required', true);
      spectator.setInput('tooltip', 'Select group to use.');

      const label = spectator.query(IxLabelComponent);
      expect(label).toExist();
      expect(label.label).toBe('Select Group');
      expect(label.required).toBe(true);
      expect(label.tooltip).toBe('Select group to use.');
    });

    it('shows loader while options are loading', async () => {
      const opt$ = options$.pipe(delay(100));
      spectator.setInput({ options: opt$ });

      expect(spectator.query('mat-progress-spinner')).toBeVisible();
      await new Promise((smth) => setTimeout(smth, 100));
      spectator.detectChanges();

      expect(spectator.query('mat-progress-spinner')).not.toBeVisible();
    });

    it('shows a list of options', async () => {
      spectator.setInput({ options: options$ });

      const select = await loader.getHarness(MatSelectHarness);
      await select.open();
      const options = await select.getOptions();
      const optionLabels = await parallel(() => options.map((option) => option.getText()));
      expect(optionLabels).toEqual(['--', 'GBR', 'GRL', 'FRA']);
    });

    it('shows the current value in the select', async () => {
      spectator.setInput({ options: options$ });
      control.setValue('France');

      const select = await loader.getHarness(MatSelectHarness);
      const currentValue = await select.getValueText();
      expect(currentValue).toBe('FRA');
    });

    it('writes values when option is selected from the dropdown', async () => {
      spectator.setInput({ options: options$ });

      const select = await loader.getHarness(MatSelectHarness);
      await select.open();
      await select.clickOptions({ text: 'GBR' });
      expect(control.value).toBe('Great Britain');
    });

    it('shows \'No options\' if options length === 0', async () => {
      spectator.component.options = of<SelectOption[]>([]);
      spectator.component.ngOnChanges();

      const select = await loader.getHarness(MatSelectHarness);
      await select.open();
      const options = await select.getOptions();
      const optionLabels = await parallel(() => options.map((option) => option.getText()));
      expect(optionLabels).toEqual(['No options']);
    });

    it('shows \'Options cannot be loaded\' if options has some error', async () => {
      spectator.component.options = throwError(() => new Error('Some Error'));
      spectator.component.ngOnChanges();

      const select = await loader.getHarness(MatSelectHarness);
      await select.open();
      const options = await select.getOptions();
      const optionLabels = await parallel(() => options.map((option) => option.getText()));
      expect(optionLabels).toEqual(['Options cannot be loaded']);
    });

    it('allows some options to be disabled', async () => {
      spectator.component.options = of([
        { label: 'GBR', value: 'Great Britain' },
        { label: 'GRL', value: 'Greenland', disabled: true },
      ]);
      spectator.component.ngOnChanges();

      const select = await loader.getHarness(MatSelectHarness);
      await select.open();
      const options = await select.getOptions();
      expect(await options[1].isDisabled()).toBe(false);
      expect(await options[2].getText()).toBe('GRL');
      expect(await options[2].isDisabled()).toBe(true);
    });

    it('shows options tooltip if it is provided', async () => {
      spectator.component.options = of([
        { label: 'GBR', value: 'Great Britain' },
        { label: 'GRL', value: 'Greenland', tooltip: 'Not really green.' },
      ]);
      spectator.component.ngOnChanges();

      const select = await loader.getHarness(MatSelectHarness);
      await select.open();

      const tooltips = spectator.queryAll(TooltipComponent);
      expect(tooltips).toHaveLength(1);
      expect(tooltips[0].message).toBe('Not really green.');
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
      const select = await loader.getHarness(MatSelectHarness);

      await select.open();
      await select.clickOptions({ text: 'GBR' });
      await select.clickOptions({ text: 'GRL' });
      const currentValue = await select.getValueText();

      expect(currentValue).toBe('GBR, GRL');
      expect(control.value).toEqual(['Great Britain', 'Greenland']);
    });
  });
});
