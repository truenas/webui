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
import { IxLabelComponent } from 'app/modules/ix-forms/components/ix-label/ix-label.component';
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
      MockComponent(IxLabelComponent),
      MockComponent(TooltipComponent),
    ],
  });

  beforeEach(() => {
    spectator = createHost('<ix-combobox [formControl]="formControl"></ix-combobox>', {
      hostProps: { formControl },
    });
  });

  describe('rendering', () => {
    it('renders a label and passes properties to it', () => {
      spectator.setInput('label', 'Apply To Group');
      spectator.setInput('required', true);
      spectator.setInput('tooltip', 'Select group to delete');

      const label = spectator.query(IxLabelComponent);
      expect(label).toExist();
      expect(label.label).toBe('Apply To Group');
      expect(label.required).toBe(true);
      expect(label.tooltip).toBe('Select group to delete');
    });
  });

  describe('form control', () => {
    it('shows value when type it in', () => {
      spectator.typeInElement('new value', 'input');
      spectator.detectComponentChanges();
      spectator.detectComponentChanges();

      expect(spectator.query('input')).toHaveValue('new value');
    });

    it('form control value is set to custom value if [allowCustomValue] enabled', () => {
      spectator.setInput('allowCustomValue', true);
      spectator.typeInElement('/my-custom-1', 'input');
      expect(formControl.value).toBe('/my-custom-1');
    });

    it('if [allowCustomValue] is disabled and user types custom value.', () => {
      spectator.setInput('allowCustomValue', false);
      spectator.typeInElement('/my-custom-2', 'input');
      expect(formControl.value).toBeNull();
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

      expect(spectator.queryAll('mat-option')).toHaveLength(4);
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

      expect(spectator.queryAll('mat-option')).toHaveLength(1);
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

      expect(spectator.queryAll('mat-option')).toHaveLength(2);
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
