import { ComponentHarness } from '@angular/cdk/testing';
import { EditorView } from '@codemirror/view';

export class AdvancedSearchHarness extends ComponentHarness {
  static hostSelector = 'ix-advanced-search';

  getResetIcon = this.locatorFor('.reset-icon');
  getInputArea = this.locatorFor('.cm-content');
  getInputPlaceholder = this.locatorFor('.cm-placeholder');
  getSwitchLink = this.locatorFor('.switch-link');

  editor: EditorView;

  setEditor(editor: EditorView): void {
    this.editor = editor;
  }

  async getValue(): Promise<string> {
    return (await (this.getInputArea())).text();
  }

  async getPlaceholder(): Promise<string> {
    return (await (this.getInputPlaceholder())).text();
  }

  async setValue(value: string): Promise<void> {
    const inputArea = await this.getInputArea();

    if (this.editor) {
      this.editor.dispatch({
        changes: { from: 0, to: 0, insert: value },
      });
    } else {
      await inputArea.setContenteditableValue(value);
    }

    return inputArea.dispatchEvent('input');
  }

  async clickSwitchToBasic(): Promise<void> {
    return (await this.getSwitchLink()).click();
  }
}
