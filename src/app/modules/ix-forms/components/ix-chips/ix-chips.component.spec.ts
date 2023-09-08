import { HarnessLoader, parallel, TestKey } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync } from '@angular/core/testing';
import { NgControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import { MatChipsModule } from '@angular/material/chips';
import { MatChipGridHarness } from '@angular/material/chips/testing';
import { FormControl } from '@ngneat/reactive-forms';
import { createHostFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { IxChipsComponent } from 'app/modules/ix-forms/components/ix-chips/ix-chips.component';
import { IxErrorsComponent } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/ix-forms/components/ix-label/ix-label.component';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';

describe('IxChipsComponent', () => {
  let formControl: FormControl<unknown>;
  let spectator: Spectator<IxChipsComponent>;
  let loader: HarnessLoader;
  let matChipList: MatChipGridHarness;
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
      MockComponent(IxLabelComponent),
    ],
  });

  beforeEach(async () => {
    formControl = new FormControl([]);
    spectator = createHost(
      '<ix-chips [formControl]="formControl"></ix-chips>', {
        hostProps: { formControl },
      },
    );
    spectator.setInput('allowNewEntries', true);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    matChipList = await loader.getHarness(MatChipGridHarness);
    matAutocomplete = await loader.getHarness(MatAutocompleteHarness);
    spectator.fixture.detectChanges();
  });

  it('renders a label and passes properties to it', () => {
    spectator.setInput('label', 'Apply To Groups');
    spectator.setInput('required', true);
    spectator.setInput('tooltip', 'Select local groups.');

    const label = spectator.query(IxLabelComponent);
    expect(label).toExist();
    expect(label.label).toBe('Apply To Groups');
    expect(label.required).toBe(true);
    expect(label.tooltip).toBe('Select local groups.');
  });

  it('after creating the chip, the input field should be cleared', async () => {
    const input = await matChipList.getInput();
    await input.setValue('operator');
    await input.sendSeparatorKey(TestKey.ENTER);

    expect(input.getValue()).toBeTruthy();
  });

  it('renders chips in the interface, if the form control has an initial value', async () => {
    formControl.setValue(['operator', 'staff']);
    const chips = await matChipList.getRows();
    const operatorChipText = await chips[0].getText();
    const staffChipText = await chips[1].getText();

    expect(chips).toHaveLength(2);
    expect(operatorChipText).toBe('operator');
    expect(staffChipText).toBe('staff');
  });

  it('sets value when user types it in', async () => {
    const input = await matChipList.getInput();
    await input.setValue('operator');
    await input.sendSeparatorKey(TestKey.ENTER);
    await input.setValue('root');
    await input.sendSeparatorKey(TestKey.ENTER);

    expect(formControl.value).toEqual(['operator', 'root']);
  });

  it('does not create chip after leaving the focus of the input if there is [allowNewEntries]=false', async () => {
    spectator.setInput('allowNewEntries', false);
    const input = await matChipList.getInput();
    await input.setValue('www-date');
    await input.blur();

    expect(formControl.value).toEqual([]);
  });

  it('does not create chip in any way if there is [allowNewEntries]=false', async () => {
    spectator.setInput('allowNewEntries', false);
    const input = await matChipList.getInput();
    await input.setValue('www-date');
    await input.sendSeparatorKey(TestKey.ENTER);

    expect(formControl.value).toEqual([]);
  });

  it('expected chip to be removed by clicking on the button with \'matChipRemove\' directive', async () => {
    formControl.setValue(['root', 'staff']);
    const chips = await matChipList.getRows();
    const rootRemoveBtn = await chips[1].getRemoveButton();
    const staffRemoveBtn = await chips[0].getRemoveButton();
    rootRemoveBtn.click();
    staffRemoveBtn.click();
    const listOfChips = await matChipList.getRows();

    expect(listOfChips).toHaveLength(0);
    expect(formControl.value).toEqual([]);
  });

  it('shows a validation message when validation fails', async () => {
    formControl.setValue(['root']);
    formControl.setValidators([Validators.required]);
    spectator.setInput('label', 'Apply To Users');
    const chips = await matChipList.getRows();
    const rootRemoveBtn = await chips[0].getRemoveButton();
    rootRemoveBtn.click();
    await matChipList.getRows();

    expect(spectator.query('.mat-mdc-form-field-error')).toHaveText('Apply To Users is required');
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
      const chips = await matChipList.getRows();
      const isOpen = await matAutocomplete.isOpen();

      expect(isOpen).toBeFalsy();
      expect(chips).toHaveLength(1);
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
      const chips = await matChipList.getRows();

      expect(chips).toHaveLength(1);
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
