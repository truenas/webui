import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnInit, ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { MatHint } from '@angular/material/form-field';
import { Compartment } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, EditorViewConfig, placeholder } from '@codemirror/view';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { basicSetup } from 'codemirror';
import {
  BehaviorSubject, Observable, combineLatest, filter, take, tap,
} from 'rxjs';
import { languageFunctionsMap } from 'app/constants/language-functions-map.constant';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { IxSelectValue } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@UntilDestroy()
@Component({
  selector: 'ix-code-editor',
  templateUrl: './ix-code-editor.component.html',
  styleUrls: ['./ix-code-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxLabelComponent,
    TestIdModule,
    IxErrorsComponent,
    MatHint,
    AsyncPipe,
  ],
})
export class IxCodeEditorComponent implements OnChanges, OnInit, AfterViewInit, ControlValueAccessor {
  @Input() label: string;
  @Input() hint: string;
  @Input() required: boolean;
  @Input() tooltip: string;
  @Input() language: CodeEditorLanguage;
  @Input() placeholder: string;

  afterViewInit$ = new BehaviorSubject<boolean>(false);

  editableCompartment = new Compartment();

  isDisabled = false;

  protected isDisabled$ = new BehaviorSubject<boolean>(false);
  protected editorReady$ = new BehaviorSubject<boolean>(false);

  @ViewChild('inputArea', { static: true }) inputArea: ElementRef<HTMLElement>;
  editorView: EditorView;

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

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.language?.currentValue) {
      this.afterViewInit$.pipe(
        filter(Boolean),
        take(1),
        tap(() => {
          this.initEditor();
          this.editorReady$.next(true);
        }),
        untilDestroyed(this),
      ).subscribe();
    }
  }

  ngOnInit(): void {
    this.handleDisableState();
    this.handleValueUpdate();
  }

  handleDisableState(): void {
    combineLatest([
      this.editorReady$.pipe(filter(Boolean)),
      this.isDisabled$,
      this.afterViewInit$.pipe(filter(Boolean)),
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
      this.afterViewInit$.pipe(filter(Boolean)),
    ]).pipe(untilDestroyed(this)).subscribe({
      next: ([, value]) => {
        this.updateValue(value);
      },
    });
  }

  ngAfterViewInit(): void {
    this.afterViewInit$.next(true);
  }

  initEditor(): void {
    const updateListener = EditorView.updateListener.of((update) => {
      if (!update.docChanged) {
        return;
      }

      this.onChange(update.state.doc.toString());
    });

    const config: EditorViewConfig = {
      doc: this.controlDirective.control?.value as string || '',
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
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }
}
