import {
  ComponentRef, Directive, TemplateRef, ViewContainerRef, AfterContentInit,
} from '@angular/core';
import { IxFormWithGlossaryComponent } from 'app/modules/forms/ix-forms/components/ix-form-with-glossary/ix-form-with-glossary.component';

@Directive({
  selector: '[withGlossary]',
  standalone: true,
})
export class WithGlossaryDirective implements AfterContentInit {
  constructor(
    private viewContainer: ViewContainerRef,
    private templateRef: TemplateRef<unknown>,
  ) {}

  ngAfterContentInit(): void {
    const glossaryRef: ComponentRef<IxFormWithGlossaryComponent>
      = this.viewContainer.createComponent(IxFormWithGlossaryComponent);

    glossaryRef.instance.viewContainerRef.createEmbeddedView(this.templateRef);
  }
}
