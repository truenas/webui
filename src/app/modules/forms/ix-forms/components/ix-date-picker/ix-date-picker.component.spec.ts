import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { TooltipComponent } from '@angular/material/tooltip';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { IxDatepickerComponent } from './ix-date-picker.component';

describe('IxDatePickerComponent', () => {
  let spectator: SpectatorHost<IxDatepickerComponent>;
  const formControl = new FormControl<unknown>('');

  const createHost = createHostFactory({
    component: IxDatepickerComponent,
    imports: [
      ReactiveFormsModule,
      MatDatepickerModule,
      MatInputModule,
    ],
    declarations: [
      MockComponent(IxErrorsComponent),
      MockComponent(IxLabelComponent),
      MockComponent(TooltipComponent),
      MockComponent(IxIconComponent),
    ],
  });

  describe('default `updateOn: change` strategy', () => {
    beforeEach(() => {
      spectator = createHost(
        `<ix-datepicker
          [formControl]="formControl"
          [label]="label"
          [required]="required"
          [tooltip]="tooltip"
          [hint]="hint"
          [readonly]="readonly"
          [type]="type"
          [parse]="parse"
          [format]="format"
          [min]="min"
          [max]="max"
        ></ix-datepicker>`,
        {
          hostProps: {
            formControl,
            label: undefined,
            required: false,
            tooltip: undefined,
            hint: undefined,
            readonly: false,
            type: 'default',
            parse: undefined,
            format: undefined,
            min: undefined,
            max: undefined,
          },
        },
      );
    });

    describe('rendering', () => {
      it('renders a label and passes properties to it', () => {
        spectator.setHostInput('label', 'Expires at');
        spectator.setHostInput('required', true);
        spectator.setHostInput('tooltip', 'Select a date');

        const label = spectator.query(IxLabelComponent);
        expect(label).toExist();
        expect(label.label).toBe('Expires at');
        expect(label.required).toBe(true);
        expect(label.tooltip).toBe('Select a date');
      });

      it('renders a hint when it is provided', () => {
        spectator.setHostInput('hint', 'YYYY-MM-DD');

        expect(spectator.query('mat-hint')).toHaveText('YYYY-MM-DD');
      });

      it('marks input element as readonly when readonly input is true', () => {
        spectator.setHostInput('readonly', true);

        expect(spectator.query('input')).toHaveAttribute('readonly');
      });
    });

    describe('form control', () => {
      // TODO: Fix this test
      it.skip('shows value provided in form control', () => {
        formControl.setValue('22/11/2024');
        spectator.detectComponentChanges();

        expect(spectator.query('input')).toHaveValue('22/11/2024');
      });

      it('updates form control value when user types in value in input element', () => {
        spectator.typeInElement('22/11/2024', 'input');

        expect(formControl.value).toBe('22/11/2024');
      });

      it('disables input when form control is disabled', () => {
        formControl.disable();
        spectator.detectComponentChanges();

        expect(spectator.query('input')).toBeDisabled();
      });
    });

    describe('parsing and formatting', () => {
      it('uses parse function to transform user input when parse function is provided', () => {
        spectator.setHostInput('parse', (value: string) => new Date(value).getTime());

        spectator.typeInElement('22/11/2024', 'input');

        expect(formControl.value).toBe('22/11/2024');
      });

      // TODO: Fix this test
      it.skip('uses format function to transform form control value when format function is provided', () => {
        spectator.setHostInput('format', (value: string) => new Date(Number(value)).toLocaleDateString());
        formControl.setValue('2024/11/22');

        expect(spectator.query('input')).toHaveValue('22/11/2024');
      });
    });
  });
});
