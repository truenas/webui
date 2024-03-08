import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { Compartment } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorViewConfig, placeholder } from '@codemirror/view';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EditorView, basicSetup } from 'codemirror';
import {
  BehaviorSubject, Observable, combineLatest, filter,
} from 'rxjs';
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
export class IxCodeEditorComponent implements ControlValueAccessor, AfterViewInit, OnInit {
  @Input() label: string;
  @Input() hint: string;
  @Input() required: boolean;
  @Input() tooltip: string;
  @Input() language: CodeEditorLanguage;
  @Input() placeholder: string;

  editableCompartment = new Compartment();

  protected isDisabled$ = new BehaviorSubject<boolean>(false);
  protected editorReady$ = new BehaviorSubject<boolean>(false);

  @ViewChild('inputArea', { static: true }) inputArea: ElementRef<HTMLElement>;
  private editorView: EditorView;

  // protected value: string;
  protected value$ = new BehaviorSubject<string>('');

  get disabledState$(): Observable<boolean> {
    return this.isDisabled$.asObservable();
  }

  constructor(
    protected controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  ngOnInit(): void {
    this.handleDisableState();
    this.handleValueUpdate();
  }

  handleDisableState(): void {
    combineLatest([
      this.editorReady$.pipe(filter(Boolean)),
      this.isDisabled$,
    ]).pipe(untilDestroyed(this)).subscribe({
      next: ([, isDisabled]) => {
        this.editorView.dispatch({
          effects: this.editableCompartment.reconfigure(EditorView.editable.of(!isDisabled)),
        });
      },
    });
  }

  handleValueUpdate(): void {
    combineLatest([
      this.editorReady$.pipe(filter(Boolean)),
      this.value$,
    ]).pipe(untilDestroyed(this)).subscribe({
      next: ([, value]) => {
        this.updateValue(value);
      },
    });
  }

  ngAfterViewInit(): void {
    this.initEditor();
    this.editorReady$.next(true);
  }

  initEditor(): void {
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
        this.editableCompartment.of(EditorView.editable.of(true)),
        placeholder(this.placeholder),
      ],
      parent: this.inputArea.nativeElement,
    };
    this.editorView = new EditorView(config);
  }

  onChange: (value: string) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(val: string): void {
    this.value$.next(val);
  }

  updateValue(val: string): void {
    const transaction = this.editorView.state.update({
      changes: {
        from: 0,
        to: this.editorView.state.doc.length,
        insert: val,
      },
    });

    if (transaction) {
      this.editorView.dispatch(transaction);
    }
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: IxSelectValue) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled$.next(isDisabled);
    this.cdr.markForCheck();
  }
}
