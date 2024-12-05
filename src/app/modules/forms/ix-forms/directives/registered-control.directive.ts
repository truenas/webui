import {
  AfterViewInit, Directive, ElementRef, inject, Input,
  OnChanges,
  OnDestroy,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';

export const ixControlLabelTag = 'ix-label';

/**
 * This directive is used to the be able to locate the template of the control programmatically via IxFormService.
 */
@Directive({
  standalone: true,
  selector: '[ixRegisteredControl]',
})
export class RegisteredControlDirective implements AfterViewInit, OnChanges, OnDestroy {
  @Input() label: string;
  @Input() formControlName: string;
  @Input() formArrayName: string;
  @Input() formGroupName: string;

  private controlReady = false;
  private labelReady = false;
  private controlRegistered = false;
  private registeredName: string;
  private control = inject(NgControl, { optional: true });

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private formService: IxFormService,
  ) { }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (this.controlRegistered) {
      return;
    }
    if (changes.label.currentValue) {
      this.labelReady = true;
      this.tryRegisterControl();
    }
    const isNameReady
      = changes.formArrayName?.currentValue
      || changes.formControlName?.currentValue
      || changes.formGroupName?.currentValue;

    if (isNameReady && !this.controlRegistered) {
      this.controlReady = true;
      this.tryRegisterControl();
    }
  }

  ngAfterViewInit(): void {
    if (this.control?.name && !this.controlRegistered) {
      this.controlReady = true;
      this.tryRegisterControl();
    }
  }

  private tryRegisterControl(): void {
    if (!this.controlReady || !this.labelReady) {
      return;
    }
    this.controlRegistered = true;
    const controlName
      = this.control?.name?.toString()
      || this.formControlName
      || this.formArrayName
      || this.formGroupName;

    const labelValue = this.label || controlName || 'Unnamed Control';

    this.elementRef.nativeElement.setAttribute(ixControlLabelTag, labelValue);
    this.registeredName = controlName;
    this.formService.registerControl(controlName, this.elementRef);
  }

  ngOnDestroy(): void {
    this.formService.unregisterControl(this.registeredName);
  }
}
