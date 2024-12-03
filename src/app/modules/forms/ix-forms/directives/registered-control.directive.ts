import { AfterViewInit, Directive, ElementRef } from '@angular/core';
import { NgControl } from '@angular/forms';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';

/**
 * This directive is used to the be able to locate the template of the control programmatically via IxFormService.
 */
@Directive({
  standalone: true,
  selector: '[ixRegisteredControl]',
})
export class RegisteredControlDirective implements AfterViewInit {
  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private formService: IxFormService,
    private control: NgControl,
  ) {}

  ngAfterViewInit(): void {
    this.formService.registerControl(this.control, this.elementRef);
  }
}
