import { HarnessLoader, parallel, TestKey } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync } from '@angular/core/testing';
import { FormsModule, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import { MatChipsModule } from '@angular/material/chips';
import { MatChipListHarness } from '@angular/material/chips/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { IxChipsComponent } from 'app/modules/ix-forms/components/ix-chips/ix-chips.component';
import { IxErrorsComponent } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';

describe('IxChipsComponent', () => {
  // const formControl = new FormControl<unknown>();
  // let componentIxChips: IxChipsComponent;
  let spectator: Spectator<IxChipsComponent>;
  let loader: HarnessLoader;
  let matChipList: MatChipListHarness;
  let matAutocomplete: MatAutocompleteHarness;
  // createHost = createHostFactory
  const createComponent = createComponentFactory({
    component: IxChipsComponent,
    imports: [
      ReactiveFormsModule,
      FormsModule,
      MatChipsModule,
      MatAutocompleteModule,
      TooltipModule,
    ],
    providers: [
      mockProvider(NgControl),
    ],
    declarations: [
      MockComponent(IxErrorsComponent),
      // MockComponent(TooltipComponent),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    // createHost
    // '<ix-chips [formControl]="formControl"></ix-chips>', {
    //   hostProps: { formControl },
    // }
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    // componentIxChips = spectator.component;
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

  it('it creates chip after leaving the focus of the input', async () => {
    const input = await matChipList.getInput();
    await input.setValue('www-date');
    await input.blur();
    const chips = await matChipList.getChips();
    const chipText = await chips[0].getText();

    expect(chips.length).toBe(1);
    expect(chipText).toBe('www-date');
  });

  it('it creates chips after typing text and key separator ENTER', async () => {
    const input = await matChipList.getInput();
    await input.setValue('operator');
    await input.sendSeparatorKey(TestKey.ENTER);
    await input.setValue('root');
    await input.sendSeparatorKey(TestKey.ENTER);
    const chips = await matChipList.getChips();
    const operatorChip = await chips[0].getText();
    const rootChip = await chips[1].getText();

    expect(chips.length).toBe(2);
    expect(operatorChip).toBe('operator');
    expect(rootChip).toBe('root');
  });

  it('===', fakeAsync(async () => {
    spectator.setInput('autocompleteProvider', jest.fn(() => of(['sys', 'staff'])));
    const input = await matChipList.getInput();
    spectator.tick(100);
    await input.setValue('s');
    spectator.fixture.detectChanges();
    const isOpen = await matAutocomplete.isOpen();
    const options = await matAutocomplete.getOptions();
    const optionsAutocomplete = await parallel(() => options.map((option) => option.getText()));

    expect(isOpen).toBeTruthy();
    expect(optionsAutocomplete).toEqual(['sys', 'staff']);
    // flush(2);
  }));
});
