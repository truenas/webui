import {
  AfterViewInit, Directive, ElementRef, Host, inject, Input,
  OnChanges,
  OnDestroy,
  Optional,
  SkipSelf,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { IxFormSectionComponent } from 'app/modules/forms/ix-forms/components/ix-form-section/ix-form-section.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
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
  @Input() formControlName: string | number;
  @Input() formArrayName: string | number;
  @Input() formGroupName: string | number;

  private controlReady = false;
  private labelReady = false;
  private controlRegistered = false;
  private registeredName: string;
  private control = inject(NgControl, { optional: true });

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private formService: IxFormService,
    @Optional() @Host() @SkipSelf() private parentFormSection: IxFormSectionComponent,
    @Optional() @Host() @SkipSelf() private listItem: IxListItemComponent,
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
    let prefix = '';
    if (this.listItem) {
      prefix = this.listItem.formGroupName().toString();
    }

    const name = this.control?.name?.toString()
      || this.formControlName?.toString()
      || this.formArrayName?.toString()
      || this.formGroupName?.toString();

    this.registeredName = prefix !== '' ? `${prefix}.${name}` : name;

    const labelValue = this.label || this.registeredName || 'Unnamed Control';

    this.elementRef.nativeElement.setAttribute(ixControlLabelTag, labelValue);
    this.formService.registerControl(this.registeredName, this.elementRef);
    if (this.parentFormSection) {
      this.formService.registerSectionControl(this.registeredName, this.control, this.parentFormSection);
    }
  }

  ngOnDestroy(): void {
    this.formService.unregisterControl(this.registeredName);
    if (this.parentFormSection) {
      this.formService.unregisterSectionControl(this.parentFormSection, this.registeredName);
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
