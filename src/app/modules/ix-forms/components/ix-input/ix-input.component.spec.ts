import { ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@ngneat/reactive-forms';
import { createHostFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { IxErrorsComponent } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { IxInputComponent } from './ix-input.component';

describe('IxInputComponent', () => {
  let spectator: Spectator<IxInputComponent>;
  const formControl = new FormControl<unknown>();
  const createHost = createHostFactory({
    component: IxInputComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(IxErrorsComponent),
      MockComponent(TooltipComponent),
    ],
  });

  beforeEach(() => {
    spectator = createHost('<ix-input [formControl]="formControl"></ix-input>', {
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

    it('renders a prefix icon when it is provided', () => {
      spectator.setInput('prefixIcon', 'person');

      expect(spectator.query('.prefix-icon')).toHaveText('person');
      expect(spectator.query('input')).toHaveClass('prefix-padding');
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

      expect(spectator.query('.label')).toHaveText('First Name*');
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

      spectator.click('.reset-input mat-icon');

      expect(formControl.value).toBe('');
    });
  });

  describe('form control', () => {
    it('shows value provided in form control', () => {
      formControl.setValue('test');

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

    it('renders input element as pseudo-password field (via search input type) to disable password managers', () => {
      formControl.setValue('test');
      spectator.setInput('type', 'password');

      expect(spectator.query('input')).toHaveAttribute('type', 'search');
    });

    it('shows button that toggles password visibility when type is password', () => {
      formControl.setValue('test');
      spectator.setInput('type', 'password');

      expect(spectator.query('input')).toHaveClass('password-field');
      expect(spectator.query('.toggle_pw')).toHaveExactText('visibility_off');

      spectator.click('.toggle_pw');

      expect(spectator.query('input')).not.toHaveClass('password-field');
      expect(spectator.query('.toggle_pw')).toHaveExactText('visibility');
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

      expect(spectator.query('.mat-error')).toHaveText('Value must be a email');
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
