import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  fromEvent, Observable, of, Subject,
} from 'rxjs';
import {
  debounceTime, distinctUntilChanged, map, takeUntil,
} from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';

@UntilDestroy()
@Component({
  selector: 'ix-combobox',
  templateUrl: './ix-combobox.component.html',
  styleUrls: ['./ix-combobox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxComboboxComponent implements ControlValueAccessor, OnChanges, OnInit {
  @Input() label: string;
  @Input() hint: string;
  @Input() required: boolean;
  @Input() tooltip: string;
  @Input() options: Observable<Option[]>;
  @ViewChild('ixInput') inputElementRef: ElementRef;
  @ViewChild('auto') autoCompleteRef: MatAutocomplete;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;
  @Output() scrollEnd: EventEmitter<string> = new EventEmitter<string>();
  placeholder = this.translate.instant('Search');
  getDisplayWith = this.displayWith.bind(this);

  @Input() filter: (options: Option[], filterValue: string) => Observable<Option[]> =
  (options: Option[], value: string): Observable<Option[]> => {
    const filtered = options.filter((option: Option) => {
      return option.label.toLowerCase().includes(value.toLowerCase())
          || option.value.toString().toLowerCase().includes(value.toLowerCase());
    });
    return of(filtered);
  };

  filteredOptions: Observable<Option[]>;
  filterChanged$ = new Subject<string>();
  formControl = new FormControl(this);
  value: string | number = '';
  isDisabled = false;
  filterValue = '';
  selectedOption: Option = null;
  syncOptions: Option[];

  onChange: (value: string | number) => void = (): void => {};
  onTouch: () => void = (): void => {};

  constructor(
    private translate: TranslateService,
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  writeValue(value: string | number): void {
    this.value = value;
    if (this.value && this.syncOptions) {
      this.selectedOption = { ...(this.syncOptions.find((option: Option) => option.value === this.value)) };
    }
    if (this.selectedOption) {
      this.filterChanged$.next('');
    }

    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    this.filterChanged$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((changedValue: string) => {
      this.filterValue = changedValue;
      if (changedValue) {
        this.filteredOptions = this.filter(this.syncOptions, changedValue);
      } else {
        this.filteredOptions = of(this.syncOptions);
      }

      this.cdr.markForCheck();
    });
  }

  onOpenDropdown(): void {
    setTimeout(() => {
      if (
        this.autoCompleteRef
        && this.autocompleteTrigger
        && this.autoCompleteRef.panel
      ) {
        fromEvent(this.autoCompleteRef.panel.nativeElement, 'scroll')
          .pipe(
            debounceTime(300),
            map(() => this.autoCompleteRef.panel.nativeElement.scrollTop),
            takeUntil(this.autocompleteTrigger.panelClosingActions),
            untilDestroyed(this),
          )
          .subscribe(() => {
            const { scrollTop, scrollHeight, clientHeight: elementHeight } = this.autoCompleteRef.panel.nativeElement;
            const atBottom = scrollHeight === scrollTop + elementHeight;
            if (atBottom) {
              this.scrollEnd.emit(this.filterValue);
            }
          });
      }
    });
  }

  onChanged(changedValue: string): void {
    this.filterChanged$.next(changedValue);
  }

  resetInput(): void {
    this.filterChanged$.next('');
    if (this.inputElementRef && this.inputElementRef.nativeElement) {
      this.inputElementRef.nativeElement.value = '';
    }
    this.selectedOption = null;
    this.onChange('');
  }

  registerOnChange(onChange: (value: string | number) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  optionSelected(option: Option): void {
    this.selectedOption = { ...option };
    this.filterChanged$.next('');
    this.onChange(this.selectedOption.value);
  }

  displayWith(): string {
    return this.selectedOption ? this.selectedOption.label : '';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.options) {
      if (changes.options.currentValue) {
        changes.options.currentValue.pipe(untilDestroyed(this)).subscribe((options: Option[]) => {
          this.syncOptions = options;
          this.filteredOptions = of(options);
          const setOption = this.syncOptions.find((option: Option) => option.value === this.value);
          this.selectedOption = setOption ? { ...setOption } : null;
          if (this.selectedOption) {
            this.filterChanged$.next('');
          }
        });
      }
    }
  }

  shouldShowResetInput(): boolean {
    return this.hasValue() && !this.isDisabled;
  }

  hasValue(): boolean {
    return this.inputElementRef?.nativeElement?.value && this.inputElementRef.nativeElement.value.length > 0;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }
}
