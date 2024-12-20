import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, input,
} from '@angular/core';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-star-rating',
  templateUrl: './ix-star-rating.component.html',
  styleUrls: ['./ix-star-rating.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxLabelComponent,
    MatIconButton,
    IxIconComponent,
    IxErrorsComponent,
    ReactiveFormsModule,
    TranslateModule,
    TestDirective,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxStarRatingComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly hint = input('');
  readonly tooltip = input('');
  readonly required = input(false);
  readonly maxRating = input(5);

  isDisabled = false;
  value: number;

  protected readonly ratings = computed(() => {
    return Array.from({ length: this.maxRating() });
  });

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
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

  protected readonly iconMarker = iconMarker;
}
