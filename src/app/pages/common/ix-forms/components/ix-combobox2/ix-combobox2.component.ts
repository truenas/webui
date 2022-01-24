import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  fromEvent, Subject,
} from 'rxjs';
import {
  debounceTime, distinctUntilChanged, map, takeUntil,
} from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { IxCombobox2Provider } from './ix-combobox2-provider.interface';

@UntilDestroy()
@Component({
  selector: 'ix-combobox2',
  templateUrl: './ix-combobox2.component.html',
  styleUrls: ['./ix-combobox2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCombobox2Component implements ControlValueAccessor, OnInit {
  @Input() label: string;
  @Input() hint: string;
  @Input() required: boolean;
  @Input() tooltip: string;
  @ViewChild('ixInput') inputElementRef: ElementRef;
  @ViewChild('auto') autoCompleteRef: MatAutocomplete;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;
  placeholder = this.translate.instant('Search');
  getDisplayWith = this.displayWith.bind(this);

  @Input() provider: IxCombobox2Provider;

  filterChanged$ = new Subject<string>();
  formControl = new FormControl(this);
  value: string | number = '';
  isDisabled = false;
  filterValue = '';
  selectedOption: Option = null;

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
    if (this.value && this.provider.options) {
      this.selectedOption = { ...(this.provider.options.find((option: Option) => option.value === this.value)) };
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
      this.provider.filter(changedValue);
      this.cdr.markForCheck();
    });

    this.provider.providerUpdater$.pipe(untilDestroyed(this)).subscribe(() => {
      const setOption = this.provider.options.find((option: Option) => option.value === this.value);
      this.selectedOption = setOption ? { ...setOption } : null;
      if (this.selectedOption) {
        this.filterChanged$.next('');
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
              this.provider.nextPage(this.filterValue);
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
