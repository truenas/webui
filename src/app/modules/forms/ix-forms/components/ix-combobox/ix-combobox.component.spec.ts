import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@ngneat/reactive-forms';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { SimpleAsyncComboboxProvider } from 'app/modules/forms/ix-forms/classes/simple-async-combobox-provider';
import { SimpleComboboxProvider } from 'app/modules/forms/ix-forms/classes/simple-combobox-provider';
import { IxComboboxProvider } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox-provider';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';

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
  let spectator: SpectatorHost<IxComboboxComponent>;
  const formControl = new FormControl<unknown>();
  const createHost = createHostFactory({
    component: IxComboboxComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(() => {
    spectator = createHost(`<ix-combobox
        [formControl]="formControl"
        [label]="label"
        [required]="required"
        [tooltip]="tooltip"
        [allowCustomValue]="allowCustomValue"
        [provider]="provider"
      ></ix-combobox>`, {
      hostProps: {
        formControl,
        label: undefined,
        required: false,
        tooltip: undefined,
        allowCustomValue: false,
        provider: undefined,
      },
    });
  });

  describe('rendering', () => {
    it('renders a label and passes properties to it', () => {
      spectator.setHostInput('label', 'Apply To Group');
      spectator.setHostInput('required', true);
      spectator.setHostInput('tooltip', 'Select group to delete');

      const label = spectator.query(IxLabelComponent);
      expect(label).toExist();
      expect(label.label()).toBe('Apply To Group');
      expect(label.required()).toBe(true);
      expect(label.tooltip()).toBe('Select group to delete');
    });
  });

  describe('form control', () => {
    it('shows value when type it in', () => {
      spectator.typeInElement('new value', 'input');
      spectator.detectComponentChanges();

      expect(spectator.query('input')).toHaveValue('new value');
    });

    it('form control value is set to custom value if [allowCustomValue] enabled', () => {
      spectator.setHostInput('allowCustomValue', true);
      spectator.typeInElement('/my-custom-1', 'input');
      expect(formControl.value).toBe('/my-custom-1');
    });

    it('if [allowCustomValue] is disabled and user types custom value.', () => {
      spectator.setHostInput('allowCustomValue', false);
      spectator.typeInElement('/my-custom-2', 'input');
      expect(formControl.value).toBeNull();
    });

    it('shows values autocomplete when type start', fakeAsync(() => {
      spectator.component.ngOnInit();
      const provider = [
        { label: 'test1', value: 'value1' },
        { label: 'test2', value: 'value2' },
        { label: 'test3', value: 'value3' },
        { label: 'badtest', value: 'value4' },
      ];

      spectator.setHostInput('provider', new SimpleComboboxProvider(provider));
      tick(300);
      spectator.typeInElement('test', 'input');
      tick(300);

      expect(spectator.queryAll('mat-option')).toHaveLength(4);
      spectator.queryAll('mat-option').forEach((item, idx) => {
        expect(item).toHaveText(provider[idx].label);
      });

      discardPeriodicTasks();
    }));

    it('shows error when options cannot be loaded', fakeAsync(() => {
      spectator.component.ngOnInit();
      spectator.setHostInput('provider', new SimpleComboboxProvider([]));
      tick(300);
      spectator.typeInElement('test', 'input');
      tick(300);

      spectator.component.hasErrorInOptions = true;
      spectator.detectComponentChanges();

      expect(spectator.queryAll('mat-option')).toHaveLength(1);
      expect(spectator.query('mat-option')).toHaveText('Options cannot be loaded');

      discardPeriodicTasks();
    }));

    it('updates form control value when select it from autocomplete', fakeAsync(() => {
      spectator.component.ngOnInit();
      const provider = [
        { label: 'test1', value: 'value1' },
        { label: 'test2', value: 'value2' },
      ];

      spectator.setHostInput('provider', new SimpleComboboxProvider(provider));
      tick(300);
      spectator.typeInElement('test', 'input');
      tick(300);

      expect(spectator.queryAll('mat-option')).toHaveLength(2);
      spectator.click(spectator.queryAll('mat-option')[1]);
      expect(formControl.value).toBe('value2');

      discardPeriodicTasks();
    }));

    it('disables input when form control is disabled', () => {
      formControl.disable();
      spectator.detectComponentChanges();

      expect(spectator.query('input')).toBeDisabled();
    });
  });

  describe('loader', () => {
    it('loader should be rendered if the provider receives async data', fakeAsync(() => {
      spectator.component.ngOnInit();
      spectator.setHostInput('provider', new SimpleAsyncComboboxProvider(of<Option[]>([]).pipe(delay(300))));
      tick(300);
      spectator.detectChanges();

      expect(spectator.query('mat-progress-spinner')).toBeVisible();
      discardPeriodicTasks();
    }));

    it('loader should be rendered during the loading of options after type in input', fakeAsync(() => {
      spectator.component.ngOnInit();
      const provider = [{ label: 'test1', value: 'value1' }];
      spectator.setHostInput('provider', new FakeProvider(provider));
      tick(300);
      spectator.typeInElement('test', 'input');
      tick(300);
      spectator.detectChanges();

      expect(spectator.query('mat-progress-spinner')).toBeVisible();
      discardPeriodicTasks();
    }));

    it('loader should be removed after loading options', fakeAsync(() => {
      spectator.setHostInput('provider', new SimpleAsyncComboboxProvider(of<Option[]>([])));
      tick(300);
      spectator.detectChanges();

      expect(spectator.query('mat-progress-spinner')).not.toBeVisible();
      discardPeriodicTasks();
    }));
  });
});
