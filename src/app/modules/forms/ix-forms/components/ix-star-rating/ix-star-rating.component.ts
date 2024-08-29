import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { MatIconButton } from '@angular/material/button';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';

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
    TestIdModule,
    IxIconModule,
    IxErrorsComponent,
    TranslateModule,
  ],
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
