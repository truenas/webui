import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorViewConfig, placeholder } from '@codemirror/view';
import { UntilDestroy } from '@ngneat/until-destroy';
import { EditorView, basicSetup } from 'codemirror';
import { languageFunctionsMap } from 'app/constants/language-functions-map.constant';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';
import { IxSelectValue } from 'app/modules/ix-forms/components/ix-select/ix-select.component';

@UntilDestroy()
@Component({
  selector: 'ix-code-editor',
  templateUrl: './ix-code-editor.component.html',
  styleUrls: ['./ix-code-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCodeEditorComponent implements ControlValueAccessor, AfterViewInit {
  @Input() label: string;
  @Input() hint: string;
  @Input() required: boolean;
  @Input() tooltip: string;
  @Input() language: CodeEditorLanguage;
  @Input() placeholder: string;

  @ViewChild('inputArea', { static: true }) inputArea: ElementRef<HTMLElement>;
  private editorView: EditorView;

  protected value: string;
  protected isDisabled = false;

  get disabledState(): boolean {
    return this.isDisabled;
  }

  constructor(
    protected controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  ngAfterViewInit(): void {
    const updateListener = EditorView.updateListener.of((update) => {
      if (!update.docChanged) {
        return;
      }

      this.onChange(update.state.doc.toString());
    });

    const config: EditorViewConfig = {
      doc: this.controlDirective.control.value as string,
      extensions: [
        basicSetup,
        updateListener,
        languageFunctionsMap[this.language](),
        oneDark,
        placeholder(this.placeholder),
      ],
      parent: this.inputArea.nativeElement,
    };
    this.editorView = new EditorView(config);
  }

  onChange: (value: IxSelectValue) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(val: string): void {
    this.value = val;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: IxSelectValue) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }
}
