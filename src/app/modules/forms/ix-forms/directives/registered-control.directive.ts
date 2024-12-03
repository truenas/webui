import {
  AfterViewInit, Directive, ElementRef, Input,
  OnChanges,
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
export class RegisteredControlDirective implements AfterViewInit, OnChanges {
  @Input() label: string;

  private controlReady = false;
  private labelReady = false;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private formService: IxFormService,
    private control: NgControl,
  ) { }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.label.currentValue) {
      this.labelReady = true;
      this.tryRegisterControl();
    }
  }

  ngAfterViewInit(): void {
    this.controlReady = true;
    this.tryRegisterControl();
  }

  private tryRegisterControl(): void {
    if (!this.controlReady || !this.labelReady) {
      return;
    }
    const labelValue
      = this.label || this.control.name?.toString() || 'Unnamed Control';

    this.elementRef.nativeElement.setAttribute(ixControlLabelTag, labelValue);
    this.formService.registerControl(this.control, this.elementRef);

    this.controlReady = false;
    this.labelReady = false;
  }
}
