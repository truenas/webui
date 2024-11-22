import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, Input,
} from '@angular/core';
import {
  ControlValueAccessor, NgControl,
} from '@angular/forms';
import { MatSlideToggleChange, MatSlideToggle } from '@angular/material/slide-toggle';
import { UntilDestroy } from '@ngneat/until-destroy';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';

@UntilDestroy()
@Component({
  selector: 'ix-slide-toggle',
  styleUrls: ['./ix-slide-toggle.component.scss'],
  templateUrl: './ix-slide-toggle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatSlideToggle,
    TooltipComponent,
    IxErrorsComponent,
    TestDirective,
  ],
})
export class IxSlideToggleComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() required: boolean;
  @Input() formControlName: string;

  isDisabled = false;
  value: boolean;

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  onChange: (value: boolean) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(value: boolean): void {
    this.value = value;
    this.cdr.markForCheck();
  }

  @HostBinding('attr.id') get id(): string {
    return this.formControlName || '';
  }

  registerOnChange(onChange: (value: boolean) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  onSlideToggleChanged(event: MatSlideToggleChange): void {
    this.value = event.checked;
    this.onChange(event.checked);
  }
}
