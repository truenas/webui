import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, input, inject } from '@angular/core';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconButtonComponent } from '@truenas/ui-components';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';

/**
 * Bare star-rating control: label, required indicator, tooltip and error text all come from the
 * wrapping `<tn-form-field>`, the same way `ix-explorer` composes into one.
 */
@Component({
  selector: 'ix-star-rating',
  templateUrl: './ix-star-rating.component.html',
  styleUrls: ['./ix-star-rating.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconButtonComponent,
    ReactiveFormsModule,
    TranslateModule,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxStarRatingComponent implements ControlValueAccessor {
  controlDirective = inject(NgControl);
  private cdr = inject(ChangeDetectorRef);

  readonly maxRating = input(5);

  isDisabled = false;
  value: number;

  protected readonly ratings = computed(() => {
    return Array.from({ length: this.maxRating() });
  });

  constructor() {
    this.controlDirective.valueAccessor = this;
  }

  onChange: (value: number) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(value: number): void {
    this.value = value > this.maxRating() ? this.maxRating() : value;
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
    this.value = value > this.maxRating() ? this.maxRating() : value;
    this.onChange(this.value);
  }
}
