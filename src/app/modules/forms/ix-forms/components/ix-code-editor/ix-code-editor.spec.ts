import { ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@ngneat/reactive-forms';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';
import { IxCodeEditorComponent } from 'app/modules/forms/ix-forms/components/ix-code-editor/ix-code-editor.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';

describe('IxCodeEditor', () => {
  let spectator: SpectatorHost<IxCodeEditorComponent>;
  const formControl = new FormControl<unknown>();
  const createHost = createHostFactory({
    component: IxCodeEditorComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(() => {
    spectator = createHost(`<ix-code-editor
        [language]="language"
        [formControl]="formControl"
        [label]="label"
        [required]="required"
        [tooltip]="tooltip"
      ></ix-code-editor>`, {
      hostProps: {
        formControl,
        language: CodeEditorLanguage.Json,
      },
    });
    spectator.setHostInput('language', CodeEditorLanguage.Json);
  });

  describe('rendering', () => {
    it('renders a label and passes properties to it', () => {
      spectator.setHostInput('label', 'Code Editor');
      spectator.setHostInput('required', true);
      spectator.setHostInput('tooltip', 'Enter json code');

      const label = spectator.query(IxLabelComponent);
      expect(label).toExist();
      expect(label.label()).toBe('Code Editor');
      expect(label.required()).toBe(true);
      expect(label.tooltip()).toBe('Enter json code');
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
      const element = spectator.query('.cm-content');
      expect(element.getAttribute('contenteditable')).toBe('true');
    });
    it('when called with true, input is disabled', () => {
      spectator.component.setDisabledState(true);
      spectator.detectChanges();
      const element = spectator.query('.cm-content');
      expect(element.getAttribute('contenteditable')).toBe('false');
    });
  });

  describe('form control', () => {
    it('shows value when type it in', () => {
      formControl.setValue('new value');
      spectator.detectComponentChanges();

      expect(spectator.component.editorView.state.doc.toString()).toBe('new value');
    });
  });
});
