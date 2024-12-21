import {
  AfterViewInit, Directive, effect, ElementRef, Host, inject, input,
  OnDestroy,
  Optional,
  SkipSelf,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { IxFormSectionComponent } from 'app/modules/forms/ix-forms/components/ix-form-section/ix-form-section.component';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';

export const ixControlLabelTag = 'ix-label';

/**
 * This directive is used to the be able to locate the template of the control programmatically via IxFormService.
 */
@Directive({
  standalone: true,
  selector: '[ixRegisteredControl]',
})
export class RegisteredControlDirective implements AfterViewInit, OnDestroy {
  label = input<string>();
  formControlName = input<string | number>();
  formArrayName = input<string | number>();
  formGroupName = input<string | number>();

  private controlReady = false;
  private labelReady = false;
  private controlRegistered = false;
  private registeredName: string;
  private control = inject(NgControl, { optional: true });

  updatesEffect = effect(() => {
    if (this.controlRegistered) {
      return;
    }

    if (this.label()) {
      this.labelReady = true;
      this.tryRegisterControl();
    }

    const formArrayName = this.formArrayName();
    const formControlName = this.formControlName();
    const formGroupName = this.formGroupName();
    const isNameReady = formArrayName || formGroupName || formControlName;

    if (isNameReady) {
      this.controlReady = true;
      this.tryRegisterControl();
    }
  });

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private formService: IxFormService,
    @Optional() @Host() @SkipSelf() private parentFormSection: IxFormSectionComponent,
  ) { }

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

    this.registeredName = this.control?.name?.toString()
    || this.formControlName()?.toString()
    || this.formArrayName()?.toString()
    || this.formGroupName()?.toString()
    || '';

    const labelValue = this.label() || this.registeredName || 'Unnamed Control';

    this.elementRef.nativeElement.setAttribute(ixControlLabelTag, labelValue);
    this.formService.registerControl(this.registeredName, this.elementRef);
    if (this.parentFormSection) {
      this.formService.registerSectionControl(this.control, this.parentFormSection);
    }
  }

  ngOnDestroy(): void {
    this.formService.unregisterControl(this.registeredName);
    if (this.parentFormSection) {
      this.formService.unregisterSectionControl(this.parentFormSection, this.control);
    }
  }
}

export const registeredDirectiveConfig = {
  directive: RegisteredControlDirective,
  inputs: [
    'label',
    'formControlName',
    'formArrayName',
    'formGroupName',
  ],
};
