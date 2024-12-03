import {
  Directive, ElementRef, Input,
  OnChanges,
} from '@angular/core';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';

export const ixControlLabelTag = 'ix-label';

/**
 * This directive is used to the be able to locate the template of the control programmatically via IxFormService.
 */
@Directive({
  standalone: true,
  selector: '[ixRegisteredNonControl]',
})
export class RegisteredNonControlDirective implements OnChanges {
  @Input() label: string;
  @Input() formArrayName: string;
  @Input() formGroupName: string;

  private labelReady = false;
  private idReady = false;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private formService: IxFormService,
  ) { }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.formArrayName?.currentValue || changes.formGroupName?.currentValue) {
      this.idReady = true;
      this.tryRegisterControl();
    }
    if (changes.label?.currentValue) {
      this.labelReady = true;
      this.tryRegisterControl();
    }
  }

  private tryRegisterControl(): void {
    if (!this.labelReady || !this.idReady) {
      return;
    }
    const labelValue = this.label || 'Unnamed Control';

    this.elementRef.nativeElement.setAttribute(ixControlLabelTag, labelValue);
    this.formService.registerNonControlForSearch(this.formArrayName || this.formGroupName, this.elementRef);
  }
}
