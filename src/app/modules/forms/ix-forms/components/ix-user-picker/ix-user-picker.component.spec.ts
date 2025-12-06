import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@ngneat/reactive-forms';
import { createHostFactory, mockProvider, SpectatorHost } from '@ngneat/spectator/jest';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { newOption, Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import { SimpleAsyncComboboxProvider } from 'app/modules/forms/ix-forms/classes/simple-async-combobox-provider';
import { SimpleComboboxProvider } from 'app/modules/forms/ix-forms/classes/simple-combobox-provider';
import { IxComboboxProvider } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox-provider';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { IxUserPickerComponent } from 'app/modules/forms/ix-forms/components/ix-user-picker/ix-user-picker.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResponse } from 'app/modules/slide-ins/slide-in.interface';

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

describe('IxUserPickerComponent', () => {
  let spectator: SpectatorHost<IxUserPickerComponent>;
  const formControl = new FormControl<unknown>();
  const createHost = createHostFactory({
    component: IxUserPickerComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(() => {
    spectator = createHost(`<ix-user-picker
        [formControl]="formControl"
        [label]="label"
        [required]="required"
        [tooltip]="tooltip"
        [allowCustomValue]="allowCustomValue"
        [provider]="provider"
      ></ix-user-picker>`, {
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

      const label = spectator.query(IxLabelComponent)!;
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

      expect(spectator.queryAll('mat-option')).toHaveLength(5);
      const options = spectator.queryAll('mat-option');
      expect(options[0]).toHaveText('Add New');
      expect(options[1]).toHaveText('test1');
      expect(options[2]).toHaveText('test2');
      expect(options[3]).toHaveText('test3');
      expect(options[4]).toHaveText('badtest');
      discardPeriodicTasks();
    }));

    // TODO: Add case to check errors when options cannot be loaded.

    it('updates form control value when select it from autocomplete', fakeAsync(() => {
      spectator.component.ngOnInit();
      const provider = [
        // 0: Add New
        { label: 'test1', value: 'value1' },
        { label: 'test2', value: 'value2' },
      ];

      spectator.setHostInput('provider', new SimpleComboboxProvider(provider));
      tick(300);
      spectator.typeInElement('test', 'input');
      tick(300);

      expect(spectator.queryAll('mat-option')).toHaveLength(3);
      spectator.click(spectator.queryAll('mat-option')[2]);
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

  describe('add new user', () => {
    describe('when user is successfully created', () => {
      let addNewSpectator: SpectatorHost<IxUserPickerComponent>;
      const addNewFormControl = new FormControl<unknown>();
      const mockSlideIn = {
        open: jest.fn(() => of({
          response: { username: 'newuser' } as User,
          error: false,
        } as SlideInResponse<User>)),
      };

      const createHostWithSlideIn = createHostFactory({
        component: IxUserPickerComponent,
        imports: [
          ReactiveFormsModule,
        ],
        providers: [
          mockProvider(SlideIn, mockSlideIn),
        ],
      });

      beforeEach(() => {
        addNewFormControl.reset();
        const initialOptions = [
          { label: 'existinguser', value: 'existinguser' },
        ];

        addNewSpectator = createHostWithSlideIn(`<ix-user-picker
          [formControl]="formControl"
          [provider]="provider"
        ></ix-user-picker>`, {
          hostProps: {
            formControl: addNewFormControl,
            provider: new SimpleComboboxProvider(initialOptions),
          },
        });
      });

      it('adds newly created user to options list immediately', fakeAsync(() => {
        addNewSpectator.component.ngOnInit();
        tick(300);

        // Verify initial options include "Add New" and existing user
        expect(addNewSpectator.component.options()).toHaveLength(2);
        expect(addNewSpectator.component.options()[0].label).toBe('Add New');
        expect(addNewSpectator.component.options()[1].label).toBe('existinguser');

        // Trigger "Add New" by setting form control value to newOption
        addNewFormControl.setValue(newOption);

        // The tap block runs synchronously, adding the user to options immediately
        // Flush microtasks to complete the Observable subscription
        tick();

        // Verify the newly created user is now in the options list
        expect(addNewSpectator.component.options()).toHaveLength(3);
        expect(addNewSpectator.component.options()[0].label).toBe('Add New');
        expect(addNewSpectator.component.options()[1].label).toBe('newuser');
        expect(addNewSpectator.component.options()[1].value).toBe('newuser');
        expect(addNewSpectator.component.options()[2].label).toBe('existinguser');

        // Verify no duplicate entries
        const userValues = addNewSpectator.component.options().map((opt) => opt.value);
        expect(new Set(userValues).size).toBe(userValues.length);

        // Verify the new user is selected
        expect(addNewSpectator.component.selectedOption()?.label).toBe('newuser');
        expect(addNewFormControl.value).toBe('newuser');

        discardPeriodicTasks();
      }));

      it('prevents duplicate entries when user already exists', fakeAsync(() => {
        addNewSpectator.component.ngOnInit();
        tick(300);

        // Manually add "newuser" to options to simulate it already existing
        const currentOptions = addNewSpectator.component.options();
        addNewSpectator.component.options.set([
          currentOptions[0], // "Add New"
          { label: 'newuser', value: 'newuser' },
          currentOptions[1], // "existinguser"
        ]);

        expect(addNewSpectator.component.options()).toHaveLength(3);

        // Try to create the same user again
        addNewFormControl.setValue(newOption);
        tick();

        // Verify no duplicate was added
        expect(addNewSpectator.component.options()).toHaveLength(3);
        const userValues = addNewSpectator.component.options().map((opt) => opt.value);
        expect(new Set(userValues).size).toBe(userValues.length);

        discardPeriodicTasks();
      }));
    });

    describe('with custom valueField', () => {
      let uidSpectator: SpectatorHost<IxUserPickerComponent>;
      const uidFormControl = new FormControl<unknown>();
      const mockSlideInWithUid = {
        open: jest.fn(() => of({
          response: { username: 'testuser', uid: 1001, id: 500 } as User,
          error: false,
        } as SlideInResponse<User>)),
      };

      const createHostWithUidProvider = createHostFactory({
        component: IxUserPickerComponent,
        imports: [
          ReactiveFormsModule,
        ],
        providers: [
          mockProvider(SlideIn, mockSlideInWithUid),
        ],
      });

      beforeEach(() => {
        uidFormControl.reset();
        // Create a provider that uses 'uid' as the value field
        const providerWithUid = new SimpleComboboxProvider([]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (providerWithUid as any).valueField = 'uid';

        uidSpectator = createHostWithUidProvider(`<ix-user-picker
          [formControl]="formControl"
          [provider]="provider"
        ></ix-user-picker>`, {
          hostProps: {
            formControl: uidFormControl,
            provider: providerWithUid,
          },
        });
      });

      it('respects provider valueField configuration for uid', fakeAsync(() => {
        uidSpectator.component.ngOnInit();
        tick(300);

        // Trigger "Add New"
        uidFormControl.setValue(newOption);
        tick();

        // Verify the value is uid (1001) not username
        expect(uidSpectator.component.selectedOption()?.value).toBe(1001);
        expect(uidSpectator.component.value).toBe(1001);

        discardPeriodicTasks();
      }));
    });

    describe('when user creation is cancelled', () => {
      let cancelSpectator: SpectatorHost<IxUserPickerComponent>;
      const cancelFormControl = new FormControl<unknown>();
      const mockSlideIn = {
        open: jest.fn(() => of({
          response: null,
          error: true,
        } as SlideInResponse<User>)),
      };

      const createHostWithSlideIn = createHostFactory({
        component: IxUserPickerComponent,
        imports: [
          ReactiveFormsModule,
        ],
        providers: [
          mockProvider(SlideIn, mockSlideIn),
        ],
      });

      beforeEach(() => {
        cancelFormControl.reset();
        cancelSpectator = createHostWithSlideIn(`<ix-user-picker
          [formControl]="formControl"
          [provider]="provider"
        ></ix-user-picker>`, {
          hostProps: {
            formControl: cancelFormControl,
            provider: new SimpleComboboxProvider([]),
          },
        });
      });

      it('clears selection when user creation is cancelled', fakeAsync(() => {
        cancelSpectator.component.ngOnInit();
        tick(300);

        // Trigger "Add New"
        cancelFormControl.setValue(newOption);
        tick(300);

        // Verify selection is cleared when cancelled
        expect(cancelSpectator.component.selectedOption()).toBeNull();
        expect(cancelSpectator.query('input')).toHaveValue('');

        discardPeriodicTasks();
      }));
    });

    describe('when slide-in throws error', () => {
      let errorSpectator: SpectatorHost<IxUserPickerComponent>;
      const errorFormControl = new FormControl<unknown>();
      const mockSlideInError = {
        open: jest.fn(() => {
          throw new Error('Slide-in error');
        }),
      };

      const createHostWithErrorSlideIn = createHostFactory({
        component: IxUserPickerComponent,
        imports: [
          ReactiveFormsModule,
        ],
        providers: [
          mockProvider(SlideIn, mockSlideInError),
        ],
      });

      beforeEach(() => {
        errorFormControl.reset();
        errorSpectator = createHostWithErrorSlideIn(`<ix-user-picker
          [formControl]="formControl"
          [provider]="provider"
        ></ix-user-picker>`, {
          hostProps: {
            formControl: errorFormControl,
            provider: new SimpleComboboxProvider([]),
          },
        });
      });

      it('handles errors gracefully and clears selection', fakeAsync(() => {
        errorSpectator.component.ngOnInit();
        tick(300);

        // Trigger "Add New"
        errorFormControl.setValue(newOption);
        tick();

        // Verify selection is cleared on error
        expect(errorSpectator.component.selectedOption()).toBeNull();
        expect(errorSpectator.query('input')).toHaveValue('');

        discardPeriodicTasks();
      }));
    });
  });
});
