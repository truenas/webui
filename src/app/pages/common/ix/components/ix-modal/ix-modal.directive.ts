import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[ix-modal-host]',
})
export class IxModalDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}
