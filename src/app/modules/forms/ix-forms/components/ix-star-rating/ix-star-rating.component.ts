import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ix-star-rating',
  templateUrl: './ix-star-rating.component.html',
  styleUrls: ['./ix-star-rating.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxStarRatingComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() required: boolean;
  @Input() maxRating = 5;

  isDisabled = false;
  value: number;

  protected readonly ratings = Array.from({ length: this.maxRating });

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  onChange: (value: number) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(value: number): void {
    this.value = value > this.maxRating ? this.maxRating : value;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: number) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  onValueChanged(value: number): void {
    this.value = value > this.maxRating ? this.maxRating : value;
    this.onChange(this.value);
  }
}
