import { ReactiveFormsModule } from '@angular/forms';
import { TooltipComponent } from '@angular/material/tooltip';
import { FormControl } from '@ngneat/reactive-forms';
import { Spectator, createHostFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';
import { IxCodeEditorComponent } from 'app/modules/ix-forms/components/ix-code-editor/ix-code-editor.component';
import { IxErrorsComponent } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/ix-forms/components/ix-label/ix-label.component';

describe('IxCodeEditor', () => {
  let spectator: Spectator<IxCodeEditorComponent>;
  const formControl = new FormControl<unknown>();
  const createHost = createHostFactory({
    component: IxCodeEditorComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(IxErrorsComponent),
      MockComponent(IxLabelComponent),
      MockComponent(TooltipComponent),
    ],
  });

  beforeEach(() => {
    spectator = createHost('<ix-code-editor [language]=\'' + CodeEditorLanguage.Json + '\' [formControl]="formControl"></ix-code-editor>', {
      hostProps: { formControl, language: CodeEditorLanguage.Json },
    });
    spectator.setInput('language', CodeEditorLanguage.Json);
  });

  describe('rendering', () => {
    it('renders a label and passes properties to it', () => {
      spectator.setInput('label', 'Code Editor');
      spectator.setInput('required', true);
      spectator.setInput('tooltip', 'Enter json code');

      const label = spectator.query(IxLabelComponent);
      expect(label).toExist();
      expect(label.label).toBe('Code Editor');
      expect(label.required).toBe(true);
      expect(label.tooltip).toBe('Enter json code');
    });
  });

  describe('setDisabledState()', () => {
    it('when called with false, sets \'isDisabled\' to false', () => {
      spectator.component.setDisabledState(false);
      expect(spectator.component.isDisabled).toBeFalsy();
    });
    it('when called with true, sets \'isDisabled\' to true', () => {
      spectator.component.setDisabledState(true);
      expect(spectator.component.isDisabled).toBeTruthy();
    });
    it('when called with false, input is not disabled', () => {
      spectator.component.setDisabledState(false);
      spectator.detectChanges();
      expect(spectator.query('input')).not.toBeDisabled();
    });
    it('when called with true, input is disabled', () => {
      spectator.component.setDisabledState(true);
      spectator.detectChanges();
      expect(spectator.query('input')).toBeDisabled();
    });
  });

  describe('form control', () => {
    it('shows value when type it in', () => {
      spectator.typeInElement('new value', 'input');
      spectator.detectComponentChanges();

      expect(spectator.query('.cm-content')).toHaveValue('new value');
    });
  });
});
