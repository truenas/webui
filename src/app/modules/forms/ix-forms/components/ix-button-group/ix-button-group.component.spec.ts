import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { FormControl } from '@ngneat/reactive-forms';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { IxButtonGroupComponent } from './ix-button-group.component';

describe('IxButtonGroupComponent', () => {
  let spectator: SpectatorHost<IxButtonGroupComponent>;
  const formControl = new FormControl<unknown>();

  const createHost = createHostFactory({
    component: IxButtonGroupComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(() => {
    spectator = createHost(
      `
        <ix-button-group
          [formControl]="formControl"
          [label]="label"
          [required]="required"
          [tooltip]="tooltip"
          [hint]="hint"
          [options]="options"
        ></ix-button-group>`,
      {
        hostProps: {
          formControl,
          label: undefined,
          required: false,
          tooltip: undefined,
        },
      },
    );
  });

  describe('rendering', () => {
    it('renders a label and passes properties to it', () => {
      spectator.setHostInput('label', 'I would like to');
      spectator.setHostInput('required', true);
      spectator.setHostInput('tooltip', 'Value is required.');

      const label = spectator.query(IxLabelComponent);
      expect(label).toExist();
      expect(label.label()).toBe('I would like to');
      expect(label.required()).toBe(true);
      expect(label.tooltip()).toBe('Value is required.');
    });

    it('renders a hint when it is provided', () => {
      spectator.setHostInput('hint', 'Capital letters only');

      expect(spectator.query('mat-hint')).toHaveText('Capital letters only');
    });
  });

  describe('form control', () => {
    it('checks values when options are provided in form control', () => {
      spectator.setHostInput('options', of([{
        label: 'A',
        value: 'a',
      }, {
        label: 'B',
        value: 'b',
      }]));
      spectator.detectComponentChanges();

      const buttons = spectator.queryAll('mat-button-toggle');
      expect(buttons).toHaveLength(2);
      expect(buttons[0].textContent).toContain('A');
      expect(buttons[1].textContent).toContain('B');
    });

    it('disables input when form control is disabled', () => {
      formControl.disable();
      spectator.detectComponentChanges();

      expect(spectator.query('mat-button-toggle-group')).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('onButtonToggleChanged()', () => {
    it('when called with true, sets "value" to be true', () => {
      const event = { value: true } as MatButtonToggleChange;
      spectator.component.onValueChanged(event);
      expect(spectator.component.value).toBeTruthy();
    });
    it('when called with false, sets "value" to be false', () => {
      const event = { value: false } as MatButtonToggleChange;
      spectator.component.onValueChanged(event);
      expect(spectator.component.value).toBeFalsy();
    });
  });
});
