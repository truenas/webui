import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy,
} from '@angular/core';
import {
  ControlValueAccessor, NgControl,
} from '@angular/forms';
import { MatCheckboxChange, MatCheckbox } from '@angular/material/checkbox';
import { MatHint } from '@angular/material/form-field';
import { UntilDestroy } from '@ngneat/until-destroy';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';

@UntilDestroy()
@Component({
  selector: 'ix-checkbox',
  styleUrls: ['./ix-checkbox.component.scss'],
  templateUrl: './ix-checkbox.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCheckbox,
    TooltipComponent,
    WarningComponent,
    IxErrorsComponent,
    MatHint,
    TestDirective,
  ],
})
export class IxCheckboxComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  @Input() label: string;
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() warning: string;
  @Input() required: boolean;

  isDisabled = false;
  value: boolean;

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
    private formService: IxFormService,
    private elementRef: ElementRef<HTMLElement>,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  ngAfterViewInit(): void {
    this.formService.registerControl(this.controlDirective, this.elementRef);
  }

  ngOnDestroy(): void {
    this.formService.unregisterControl(this.controlDirective);
  }

  onChange: (value: boolean) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(value: boolean): void {
    this.value = value;
    this.cdr.markForCheck();
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

  onCheckboxChanged(event: MatCheckboxChange): void {
    this.value = event.checked;
    this.onChange(event.checked);
  }
}
