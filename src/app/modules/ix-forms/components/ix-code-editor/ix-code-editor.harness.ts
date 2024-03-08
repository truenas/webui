import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { EditorView } from 'codemirror';
import { IxLabelHarness } from 'app/modules/ix-forms/components/ix-label/ix-label.harness';
import { IxFormControlHarness } from 'app/modules/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/ix-forms/utils/harness.utils';

export interface IxCodeEditorFilters extends BaseHarnessFilters {
  label?: string;
}

export class IxCodeEditorHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-code-editor';

  static with(options: IxCodeEditorFilters): HarnessPredicate<IxCodeEditorHarness> {
    return new HarnessPredicate(IxCodeEditorHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getEditorLines = this.locatorForAll('.cm-line');
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
  }

  async getValue(): Promise<string> {
    const editor = EditorView.findFromDOM(document.querySelector('.input-container'));
    return Promise.resolve(editor.state.doc.toString());
  }

  setValue(value: string): Promise<void> {
    const editor = EditorView.findFromDOM(document.querySelector('.input-container'));
    const transaction = editor.state.update({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: value,
      },
    });

    if (transaction) {
      editor.dispatch(transaction);
    }
    return Promise.resolve();
  }

  isDisabled(): Promise<boolean> {
    const editor = EditorView.findFromDOM(document.querySelector('.input-container'));
    return Promise.resolve(editor.state.readOnly);
  }
}
