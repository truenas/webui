import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, UntypedFormControl, NgControl } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  EMPTY,
  fromEvent, Subject,
} from 'rxjs';
import {
  catchError,
  debounceTime, distinctUntilChanged, map, takeUntil,
} from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { IxComboboxProvider } from 'app/modules/ix-forms/components/ix-combobox/ix-combobox-provider';

@UntilDestroy()
@Component({
  selector: 'ix-combobox',
  templateUrl: './ix-combobox.component.html',
  styleUrls: ['./ix-combobox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxComboboxComponent implements ControlValueAccessor, OnInit {
  @Input() label: string;
  @Input() hint: string;
  @Input() required: boolean;
  @Input() tooltip: string;
  options: Option[] = [];
  @ViewChild('ixInput') inputElementRef: ElementRef;
  @ViewChild('auto') autoCompleteRef: MatAutocomplete;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;
  placeholder = this.translate.instant('Search');
  getDisplayWith = this.displayWith.bind(this);
  hasErrorInOptions = false;

  loading = false;

  @Input() provider: IxComboboxProvider;

  private filterChanged$ = new Subject<string>();
  formControl = new UntypedFormControl(this);
  value: string | number = '';
  isDisabled = false;
  filterValue: string;
  selectedOption: Option = null;
  textContent = '';

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
    if (this.value && this.options && this.options.length) {
      this.selectedOption = { ...(this.options.find((option: Option) => option.value === this.value)) };
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
      if (this.filterValue === changedValue) {
        return;
      }
      this.filterValue = changedValue;
      this.filterOptions(changedValue);
    });
    this.filterChanged$.next('');
  }

  filterOptions(filterValue: string): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.provider?.fetch(filterValue).pipe(
      catchError(() => {
        this.hasErrorInOptions = true;
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe((options: Option[]) => {
      this.loading = false;
      this.cdr.markForCheck();

      this.options = options;
      const selectedOptionFromLabel = this.options.find((option: Option) => option.label === filterValue);
      if (selectedOptionFromLabel) {
        this.selectedOption = selectedOptionFromLabel;
        this.value = selectedOptionFromLabel.value;
        this.onChange(this.value);
      }
      if (!this.selectedOption && this.value !== null && this.value !== '') {
        const setOption = this.options.find((option: Option) => option.value === this.value);
        if (setOption) {
          this.selectedOption = setOption ? { ...setOption } : null;
          if (this.selectedOption) {
            this.filterChanged$.next('');
          }
        } else {
          /**
           * We are adding a custom fake option here so we can show the current value of the control even
           * if we haven't found the correct option in the list of options fetched so far. The assumption
           * is that the correct option exists in one of the following pages of list of options
           */
          this.options.push({ label: this.value as string, value: this.value });
          this.selectedOption = { ...this.options.find((option: Option) => option.value === this.value) };
          if (this.selectedOption) {
            this.filterChanged$.next('');
          }
        }
      }
      this.cdr.markForCheck();
    });
  }

  onOpenDropdown(): void {
    setTimeout(() => {
      if (
        !this.autoCompleteRef
        || !this.autocompleteTrigger
        || !this.autoCompleteRef.panel
      ) {
        return;
      }

      fromEvent(this.autoCompleteRef.panel.nativeElement, 'scroll')
        .pipe(
          debounceTime(300),
          map(() => this.autoCompleteRef.panel.nativeElement.scrollTop),
          takeUntil(this.autocompleteTrigger.panelClosingActions),
          untilDestroyed(this),
        ).subscribe(() => {
          const { scrollTop, scrollHeight, clientHeight: elementHeight } = this.autoCompleteRef.panel.nativeElement;
          const atBottom = scrollHeight === scrollTop + elementHeight;
          if (!atBottom) {
            return;
          }

          this.loading = true;
          this.cdr.markForCheck();
          this.provider?.nextPage(this.filterValue !== null || this.filterValue !== undefined ? this.filterValue : '')
            .pipe(untilDestroyed(this)).subscribe((options: Option[]) => {
              this.loading = false;
              this.cdr.markForCheck();
              /**
               * The following logic checks if we used a fake option to show value for an option that exists
               * on one of the following pages of the list of options for this combobox. If we have done so
               * previously, we want to remove that option if we managed to find the correct option on the
               * page we just fetched
               */
              const valueIndex = this.options.findIndex(
                (option) => option.label === (this.value as string) && option.value === this.value,
              );

              if (
                options.some((option) => option.value === this.value)
                && valueIndex >= 0
              ) {
                this.options.splice(valueIndex, 1);
              }
              this.options.push(...options);
              this.cdr.markForCheck();
            });
        });
    });
  }

  onChanged(changedValue: string): void {
    if (this.selectedOption || this.value) {
      this.resetInput();
    }
    this.textContent = changedValue;
    this.filterChanged$.next(changedValue);
  }

  resetInput(): void {
    this.filterChanged$.next('');
    if (this.inputElementRef && this.inputElementRef.nativeElement) {
      this.inputElementRef.nativeElement.value = '';
    }
    this.selectedOption = null;
    this.value = null;
    this.textContent = '';
    this.onChange(null);
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
    this.value = this.selectedOption.value;
    this.onChange(this.selectedOption.value);
  }

  displayWith(): string {
    return this.selectedOption ? this.selectedOption.label : '';
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
