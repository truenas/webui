import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormsModule, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatSelectHarness } from '@angular/material/select/testing';
import { FormControl } from '@ngneat/reactive-forms';
import {
  createHostFactory,
  Spectator,
  mockProvider,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { Observable, of, throwError } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxErrorsComponent } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
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
    ],
  });

  describe('ix-select', () => {
    beforeEach(() => {
      control = new FormControl<string>();
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

    it('when called with false, sets \'isDisabled\' to false', () => {
      spectator.component.setDisabledState(false);
      expect(spectator.component.isDisabled).toBeFalsy();
    });

    it('when called with true, sets \'isDisabled\' to true', () => {
      spectator.component.setDisabledState(true);
      expect(spectator.component.isDisabled).toBeTruthy();
    });

    it('MatSelect should be disabled', async () => {
      spectator.component.setDisabledState(true);

      const select = await loader.getHarness(MatSelectHarness);
      const state = await select.isDisabled();

      expect(state).toBeTruthy();
    });

    it('shows a list of labels', async () => {
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
      expect(currentValue).toEqual('FRA');
    });

    it('writes values when label is selected from the dropdown', async () => {
      spectator.setInput({ options: options$ });

      const select = await loader.getHarness(MatSelectHarness);
      await select.open();
      await select.clickOptions({ text: 'GBR' });
      expect(control.value).toEqual('Great Britain');
    });

    it('shows \'No options\' if options length === 0', async () => {
      spectator.component.options = of([]);
      spectator.component.ngOnChanges();

      const select = await loader.getHarness(MatSelectHarness);
      await select.open();
      const options = await select.getOptions();
      const optionLabels = await parallel(() => options.map((option) => option.getText()));
      expect(optionLabels).toEqual(['No options']);
    });

    it('shows \'Options cannot be loaded\' if options has some error', async () => {
      spectator.component.options = throwError('Some Error');
      spectator.component.ngOnChanges();

      const select = await loader.getHarness(MatSelectHarness);
      await select.open();
      const options = await select.getOptions();
      const optionLabels = await parallel(() => options.map((option) => option.getText()));
      expect(optionLabels).toEqual(['Options cannot be loaded']);
    });
  });

  describe('select multiple', () => {
    beforeEach(() => {
      options$ = of([
        { label: 'GBR', value: 'Great Britain' },
        { label: 'GRL', value: 'Greenland' },
        { label: 'FRA', value: 'France' },
      ]);
      control = new FormControl<string>();
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

      expect(control.value).toEqual(['Great Britain', 'Greenland']);
    });
  });
});
