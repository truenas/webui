import {
  Component, forwardRef, Input, OnChanges, OnInit, SimpleChanges,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';

@UntilDestroy()
@Component({
  selector: 'ix-select',
  styleUrls: ['./ix-select.component.scss'],
  templateUrl: './ix-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => IxSelect),
    },
  ],
})
export class IxSelect implements ControlValueAccessor, OnInit, OnChanges {
  @Input() label: string;
  @Input() value: string | number;
  @Input() hint: string;
  @Input() options: Observable<Option[]>;
  @Input() required: boolean;
  @Input() tooltip: string;

  syncOptions: Option[];

  formControl = new FormControl(this).value as FormControl;

  touched = false;

  onChange: any = (): void => {};
  onTouched: any = (): void => {};

  writeValue(val: string | number): void {
    this.value = val;
    this.onChange(val);
    this.onTouched();
  }

  registerOnChange(onChange: any): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: any): void {
    this.onTouched = onTouched;
  }

  ngOnInit(): void {
    this.options?.pipe(untilDestroyed(this)).subscribe((options: Option[]) => {
      this.syncOptions = options;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.options) {
      if (changes.options.currentValue) {
        changes.options.currentValue.pipe(untilDestroyed(this)).subscribe((options: Option[]) => {
          this.syncOptions = options;
        });
      }
    }
  }
}
