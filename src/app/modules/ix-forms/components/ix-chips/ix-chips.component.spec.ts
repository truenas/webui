import { HarnessLoader, parallel, TestKey } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync } from '@angular/core/testing';
import { NgControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import { MatChipsModule } from '@angular/material/chips';
import { MatChipListHarness } from '@angular/material/chips/testing';
import { FormControl } from '@ngneat/reactive-forms';
import { createHostFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { IxChipsComponent } from 'app/modules/ix-forms/components/ix-chips/ix-chips.component';
import { IxErrorsComponent } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';

describe('IxChipsComponent', () => {
  let formControl: FormControl<unknown>;
  let spectator: Spectator<IxChipsComponent>;
  let loader: HarnessLoader;
  let matChipList: MatChipListHarness;
  let matAutocomplete: MatAutocompleteHarness;
  const createHost = createHostFactory({
    component: IxChipsComponent,
    imports: [
      ReactiveFormsModule,
      MatAutocompleteModule,
      MatChipsModule,
      TooltipModule,
    ],
    providers: [
      mockProvider(NgControl),
    ],
    declarations: [
      IxErrorsComponent,
    ],
  });

  beforeEach(async () => {
    formControl = new FormControl([]);
    spectator = createHost(
      '<ix-chips [formControl]="formControl"></ix-chips>', {
        hostProps: { formControl },
      },
    );
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    matChipList = await loader.getHarness(MatChipListHarness);
    matAutocomplete = await loader.getHarness(MatAutocompleteHarness);
    spectator.fixture.detectChanges();
  });

  it('shows an asterisk when label is provided and required is true', () => {
    spectator.setInput('label', 'Apply To Groups');
    spectator.setInput('required', true);

    expect(spectator.query('.label')).toHaveText('Apply To Groups *');
  });

  it('renders a hint when it is provided', () => {
    spectator.setInput('hint', 'Separate values with commas');

    expect(spectator.query('mat-hint')).toHaveText('Separate values with commas');
  });

  it('renders a tooltip next when it and the labels are provided', () => {
    spectator.setInput('label', 'Apply To Groups');
    spectator.setInput('tooltip', 'Enter the location of the system.');
    const tooltipEl = spectator.query('ix-tooltip');
    const tooltip = spectator.query(TooltipComponent);

    expect(tooltipEl).toBeTruthy();
    expect(tooltip.header).toBe('Apply To Groups');
    expect(tooltip.message).toBe('Enter the location of the system.');
  });

  it('after creating the chip, the input field should be cleared', async () => {
    const input = await matChipList.getInput();
    await input.setValue('operator');
    await input.sendSeparatorKey(TestKey.ENTER);

    expect(input.getValue()).toBeTruthy();
  });

  it('it renders chips in the interface, if the form control has an initial value', async () => {
    formControl.setValue(['operator', 'staff']);
    const chips = await matChipList.getChips();
    const operatorChipText = await chips[0].getText();
    const staffChipText = await chips[1].getText();

    expect(chips.length).toBe(2);
    expect(operatorChipText).toBe('operator');
    expect(staffChipText).toBe('staff');
  });

  it('it sets value when user types it in', async () => {
    const input = await matChipList.getInput();
    await input.setValue('operator');
    await input.sendSeparatorKey(TestKey.ENTER);
    await input.setValue('root');
    await input.sendSeparatorKey(TestKey.ENTER);

    expect(formControl.value).toEqual(['operator', 'root']);
  });

  it('it creates chip after leaving the focus of the input', async () => {
    const input = await matChipList.getInput();
    await input.setValue('www-date');
    await input.blur();

    expect(formControl.value).toEqual(['www-date']);
  });

  it('expected chip to be removed by clicking on the button with \'matChipRemove\' directive', async () => {
    formControl.setValue(['root', 'staff']);
    const chips = await matChipList.getChips();
    const rootRemoveBtn = await chips[1].getRemoveButton();
    const staffRemoveBtn = await chips[0].getRemoveButton();
    rootRemoveBtn.click();
    staffRemoveBtn.click();
    const listOfChips = await matChipList.getChips();

    expect(listOfChips.length).toBe(0);
    expect(formControl.value).toEqual([]);
  });

  it('shows a validation message when validation fails', async () => {
    formControl.setValue(['root']);
    formControl.setValidators([Validators.required]);
    spectator.setInput('label', 'Apply To Users');
    const chips = await matChipList.getChips();
    const rootRemoveBtn = await chips[0].getRemoveButton();
    rootRemoveBtn.click();
    await matChipList.getChips();

    expect(spectator.query('.mat-error')).toHaveText('Apply To Users is required');
  });

  it('disables input when form control is disabled', async () => {
    formControl.disable();
    const input = await matChipList.getInput();
    const container = spectator.query('ix-chips .input-container');

    expect(await input.isDisabled()).toBeTruthy();
    expect(container).toHaveClass('disabled');
  });

  describe('ix-chip with autocomplete panel', () => {
    it('the autocomplete list should be open after focused on the input', fakeAsync(async () => {
      spectator.setInput('autocompleteProvider', jest.fn(() => of(['sys', 'staff'])));
      spectator.tick(100);
      const input = await matChipList.getInput();
      await input.focus();
      const isOpen = await matAutocomplete.isOpen();
      const options = await matAutocomplete.getOptions();
      const optionsAutocomplete = await parallel(() => options.map((option) => option.getText()));

      expect(isOpen).toBeTruthy();
      expect(optionsAutocomplete).toEqual(['sys', 'staff']);
    }));

    it('it sets value when user selects it from autocomplete,'
      + ' after autocomplete should be closed', fakeAsync(async () => {
      spectator.setInput('autocompleteProvider', jest.fn(() => of(['ssl-cert', 'staff'])));
      spectator.tick(100);
      const input = await matChipList.getInput();
      await input.setValue('s');
      spectator.tick(100);
      const options = await matAutocomplete.getOptions();
      await options[0].click();
      const chips = await matChipList.getChips();
      const isOpen = await matAutocomplete.isOpen();

      expect(isOpen).toBeFalsy();
      expect(chips.length).toBe(1);
      expect(formControl.value).toEqual(['ssl-cert']);
    }));

    it('the autocomplete list should be open after creating the chip', fakeAsync(async () => {
      spectator.setInput('autocompleteProvider', jest.fn(() => of(['ssl-cert', 'staff'])));
      spectator.tick(100);
      const input = await matChipList.getInput();
      await input.setValue('ssl-cert');
      spectator.tick(100);
      await input.sendSeparatorKey(TestKey.ENTER);
      const isOpen = await matAutocomplete.isOpen();
      const chips = await matChipList.getChips();

      expect(chips.length).toBe(1);
      expect(isOpen).toBeTruthy();
    }));

    it('the autocomplete panel should be hidden if list is empty', fakeAsync(async () => {
      spectator.setInput('autocompleteProvider', jest.fn(() => of([])));
      spectator.tick(100);
      const input = await matChipList.getInput();
      await input.focus();
      const isOpen = await matAutocomplete.isOpen();

      expect(isOpen).toBeFalsy();
    }));
  });
});
