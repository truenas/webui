import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormControl } from '@ngneat/reactive-forms';
import { createHostFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { SimpleAsyncComboboxProvider } from 'app/modules/ix-forms/classes/simple-async-combobox-provider';
import { SimpleComboboxProvider } from 'app/modules/ix-forms/classes/simple-combobox-provider';
import { IxComboboxProvider } from 'app/modules/ix-forms/components/ix-combobox/ix-combobox-provider';
import { IxComboboxComponent } from 'app/modules/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxErrorsComponent } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';

class FakeProvider implements IxComboboxProvider {
  constructor(private options: Option[]) { }

  fetch(filterValue: string): Observable<Option[]> {
    this.options[0].label = filterValue;
    return of(this.options)
      .pipe(delay(100));
  }

  nextPage(filterValue: string): Observable<Option[]> {
    return this.fetch(filterValue);
  }
}

describe('IxComboboxComponent', () => {
  let spectator: Spectator<IxComboboxComponent>;
  const formControl = new FormControl<unknown>();
  const createHost = createHostFactory({
    component: IxComboboxComponent,
    imports: [
      ReactiveFormsModule,
      MatAutocompleteModule,
    ],
    declarations: [
      MockComponent(IxErrorsComponent),
      MockComponent(TooltipComponent),
    ],
  });

  beforeEach(() => {
    spectator = createHost('<ix-combobox [formControl]="formControl"></ix-combobox>', {
      hostProps: { formControl },
    });
  });

  describe('rendering', () => {
    it('renders a hint when it is provided', () => {
      spectator.setInput('hint', 'Capital letters only');

      expect(spectator.query('mat-hint')).toHaveText('Capital letters only');
    });

    it('renders a label when it is provided', () => {
      spectator.setInput('label', 'First Name');

      expect(spectator.query('.label')).toHaveText('First Name');
    });

    it('renders a tooltip next when it and the labels are provided', () => {
      spectator.setInput('tooltip', 'Enter your first name');
      spectator.setInput('label', 'First Name');

      const tooltip = spectator.query(TooltipComponent);
      expect(tooltip.header).toBe('First Name');
      expect(tooltip.message).toBe('Enter your first name');
    });

    it('shows an asterisk when label is provided and required is true', () => {
      spectator.setInput('label', 'First Name');
      spectator.setInput('required', true);

      expect(spectator.query('.label')).toHaveText('First Name *');
    });
  });

  describe('form control', () => {
    it('shows value when type it in', () => {
      spectator.typeInElement('new value', 'input');
      spectator.detectComponentChanges();

      expect(spectator.query('input')).toHaveValue('new value');
    });

    it('shows values autocomplete when type start', async () => {
      const provider = [
        { label: 'test1', value: 'value1' },
        { label: 'test2', value: 'value2' },
        { label: 'test3', value: 'value3' },
        { label: 'badtest', value: 'value4' },
      ];

      spectator.setInput('provider', new SimpleComboboxProvider(provider));
      await new Promise((smth) => setTimeout(smth, 300));
      spectator.typeInElement('test', 'input');

      expect(spectator.queryAll('mat-option').length).toEqual(4);
      spectator.queryAll('mat-option').forEach((item, idx) => {
        expect(item).toHaveText(provider[idx].label);
      });
    });

    it('shows error when options cannot be loaded', async () => {
      spectator.setInput('provider', new SimpleComboboxProvider([]));
      await new Promise((smth) => setTimeout(smth, 300));
      spectator.typeInElement('test', 'input');

      spectator.component.hasErrorInOptions = true;
      spectator.detectComponentChanges();

      expect(spectator.queryAll('mat-option').length).toEqual(1);
      expect(spectator.query('mat-option')).toHaveText('Options cannot be loaded');
    });

    it('updates form control value when select it from autocomplete', async () => {
      const provider = [
        { label: 'test1', value: 'value1' },
        { label: 'test2', value: 'value2' },
      ];

      spectator.setInput('provider', new SimpleComboboxProvider(provider));
      await new Promise((smth) => setTimeout(smth, 300));
      spectator.typeInElement('test', 'input');

      expect(spectator.queryAll('mat-option').length).toEqual(2);
      spectator.click(spectator.queryAll('mat-option')[1]);
      expect(formControl.value).toBe('value2');
    });

    it('disables input when form control is disabled', () => {
      formControl.disable();
      spectator.detectComponentChanges();

      expect(spectator.query('input')).toBeDisabled();
    });
  });

  describe('loader', () => {
    it('loader should be rendered if the provider receives async data', async () => {
      spectator.setInput('provider', new SimpleAsyncComboboxProvider(of([]).pipe(delay(300))));
      await new Promise((smth) => setTimeout(smth, 300));
      spectator.detectChanges();

      expect(spectator.query('mat-progress-spinner')).toBeVisible();
    });

    it('loader should be rendered during the loading of options after type in input', async () => {
      const provider = [{ label: 'test1', value: 'value1' }];
      spectator.setInput('provider', new FakeProvider(provider));
      await new Promise((smth) => setTimeout(smth, 300));
      await new Promise((smth) => setTimeout(smth, 100));
      spectator.typeInElement('test', 'input');
      await new Promise((smth) => setTimeout(smth, 300));
      spectator.detectChanges();

      expect(spectator.query('mat-progress-spinner')).toBeVisible();
    });

    it('loader should be removed after loading options', async () => {
      spectator.setInput('provider', new SimpleAsyncComboboxProvider(of([])));
      await new Promise((smth) => setTimeout(smth, 300));
      spectator.detectChanges();

      expect(spectator.query('mat-progress-spinner')).not.toBeVisible();
    });
  });
});
