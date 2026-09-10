import { ComponentHarness } from '@angular/cdk/testing';
import { UnitTestElement } from '@angular/cdk/testing/testbed';
import { EditorView } from 'codemirror';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';

export class IxCodeEditorHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-code-editor';

  getEditorLines = this.locatorForAll('.cm-line');
  getErrorText = getErrorText;

  /**
   * Always '': the control renders no label of its own since it became a bare control, so the
   * enclosing `tn-form-field` is what names it. `TnFormControlHarness` reads the label off that
   * field and only delegates the *value* here, so nothing asks this for a name.
   */
  getLabelText(): Promise<string> {
    return Promise.resolve('');
  }

  getInputArea = this.locatorFor('.cm-content');

  async getValue(): Promise<string> {
    const editor = await this.getEditor();
    return editor.state.doc.toString();
  }

  async setValue(value: string): Promise<void> {
    const inputArea = await this.getInputArea();
    await inputArea.setContenteditableValue?.(value);

    await inputArea.dispatchEvent('input');

    // Using fakeAsync doesn't work for some reason.
    await new Promise((resolve) => {
      setTimeout(resolve);
    });

    await this.forceStabilize();
  }

  async isDisabled(): Promise<boolean> {
    const editor = await this.getEditor();
    return editor.state.readOnly;
  }

  /**
   * Scoped to this harness's own host. A document-wide `.input-container` lookup would resolve to
   * the first match on the page, which is the wrong editor in a form holding two of them — and
   * `ix-ip-input-with-netmask` renders a `.input-container` of its own, so a form holding both
   * would hand `findFromDOM` a div with no editor in it and throw.
   */
  private async getEditor(): Promise<EditorView> {
    const host = (await this.host()) as UnitTestElement;
    const container = host.element.querySelector<HTMLElement>('.input-container');
    if (!container) {
      throw new Error('Input container not found');
    }

    const editor = EditorView.findFromDOM(container);
    if (!editor) {
      throw new Error('Editor not found');
    }

    return editor;
  }
}
