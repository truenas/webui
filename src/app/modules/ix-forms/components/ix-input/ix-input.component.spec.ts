import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormControl } from '@ngneat/reactive-forms';
import { createHostFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { IxErrorsComponent } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/ix-forms/components/ix-label/ix-label.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { IxInputComponent } from './ix-input.component';

describe('IxInputComponent', () => {
  let spectator: Spectator<IxInputComponent>;
  const formControl = new FormControl<unknown>();
  const createHost = createHostFactory({
    component: IxInputComponent,
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
    spectator = createHost('<ix-input [formControl]="formControl"></ix-input>', {
      hostProps: { formControl },
    });
  });

  describe('rendering', () => {
    it('renders a label and passes properties to it', () => {
      spectator.setInput('label', 'New Password');
      spectator.setInput('required', true);
      spectator.setInput('tooltip', 'Minimum length is 8 characters.');

      const label = spectator.query(IxLabelComponent);
      expect(label).toExist();
      expect(label.label).toBe('New Password');
      expect(label.required).toBe(true);
      expect(label.tooltip).toBe('Minimum length is 8 characters.');
    });

    it('renders a hint when it is provided', () => {
      spectator.setInput('hint', 'Capital letters only');

      expect(spectator.query('mat-hint')).toHaveText('Capital letters only');
    });

    it('renders a prefix icon when it is provided', () => {
      spectator.setInput('prefixIcon', 'person');

      expect(spectator.query('.prefix-icon ix-icon')).toHaveLength(1);
      expect(spectator.query('input')).toHaveClass('prefix-padding');
    });

    it('marks input element as readonly when readonly input is true', () => {
      spectator.setInput('readonly', true);

      expect(spectator.query('input')).toHaveAttribute('readonly');
    });

    it('passes autocomplete attribute to the input element', () => {
      spectator.setInput('autocomplete', 'on');

      expect(spectator.query('input')).toHaveAttribute('autocomplete', 'on');
    });

    it('shows button that resets input when input is not empty', () => {
      formControl.setValue('test');
      spectator.detectComponentChanges();

      spectator.click('.reset-input ix-icon');

      expect(formControl.value).toBe('');
    });

    it('shows button that resets input when input type is number and value is 0', () => {
      formControl.setValue('0');
      spectator.detectComponentChanges();

      spectator.click('.reset-input ix-icon');

      expect(formControl.value).toBe('');
    });
  });

  describe('form control', () => {
    it('shows value provided in form control', () => {
      formControl.setValue('test');
      spectator.detectComponentChanges();

      expect(spectator.query('input')).toHaveValue('test');
    });

    it('updates form control value when user types in value in input element', () => {
      spectator.typeInElement('new value', 'input');

      expect(formControl.value).toBe('new value');
    });

    it('disables input when form control is disabled', () => {
      formControl.disable();
      spectator.detectComponentChanges();

      expect(spectator.query('input')).toBeDisabled();
    });
  });

  describe('types', () => {
    it('passes type to input when it is not password', () => {
      spectator.setInput('type', 'email');

      expect(spectator.query('input')).toHaveAttribute('type', 'email');
    });

    it('converts user input to a number when type is number', () => {
      spectator.setInput('type', 'number');

      spectator.typeInElement('123', 'input');

      expect(formControl.value).toBe(123);
    });

    it('counts 0 as valid when type is number', () => {
      spectator.setInput('type', 'number');

      spectator.typeInElement('0', 'input');

      expect(formControl.value).toBe(0);
      expect(spectator.query('.mat-mdc-form-field-error')).toBeNull();
    });

    it('renders input element as pseudo-password field (via search input type) to disable password managers', () => {
      formControl.setValue('test');
      spectator.setInput('type', 'password');

      expect(spectator.query('input')).toHaveAttribute('type', 'text');
    });

    it('shows button that toggles password visibility when type is password', () => {
      formControl.setValue('test');
      spectator.setInput('type', 'password');

      expect(spectator.query('input')).toHaveClass('password-field');
      expect(spectator.query(IxIconComponent).name).toBe('visibility_off');

      spectator.click('.toggle_pw');

      expect(spectator.query('input')).not.toHaveClass('password-field');
      expect(spectator.query(IxIconComponent).name).toBe('visibility');
    });
  });

  describe('validation', () => {
    it('shows a validation message when native input type validation does not pass', () => {
      spectator.setInput('type', 'email');

      // jest doesn't support native validators
      spectator.component.input({
        validity: {
          badInput: true,
        },
        value: 'invalid',
      } as HTMLInputElement);
      spectator.detectComponentChanges();

      expect(spectator.query('.mat-mdc-form-field-error')).toHaveText('Value must be a email');
    });
  });

  describe('parsing and formatting', () => {
    it('uses parse function to transform user input when parse function is provided', () => {
      spectator.setInput('parse', (value: string) => value.toUpperCase());

      spectator.typeInElement('test', 'input');

      expect(formControl.value).toBe('TEST');
    });

    it('uses format function to transform form control value when format function is provided', () => {
      spectator.setInput('format', (value: string) => value.toUpperCase());
      formControl.setValue('test');

      expect(spectator.query('input')).toHaveValue('TEST');
    });
  });
});
