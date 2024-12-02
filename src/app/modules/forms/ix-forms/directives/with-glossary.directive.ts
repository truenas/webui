import {
  ComponentRef, Directive, Input, TemplateRef, ViewContainerRef, ViewRef, AfterContentInit,
} from '@angular/core';
import { FormGroupDirective } from '@angular/forms';
import { IxFormWithGlossaryComponent } from 'app/modules/forms/ix-forms/components/ix-form-with-glossary/ix-form-with-glossary.component';

@Directive({
  selector: '[withGlossary]',
  standalone: true,
})
export class WithGlossaryDirective implements AfterContentInit {
  @Input('withGlossary') formGroup!: FormGroupDirective;
  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
  ) {}

  ngAfterContentInit(): void {
    this.viewContainer.clear();

    const componentRef: ComponentRef<IxFormWithGlossaryComponent> = this.viewContainer.createComponent(
      IxFormWithGlossaryComponent,
    );

    const embeddedView = this.viewContainer.createEmbeddedView(this.templateRef);
    const contentContainer = componentRef.instance.viewContainerRef;
    embeddedView.rootNodes.forEach((node: ViewRef) => contentContainer.insert(node));
  }
}
