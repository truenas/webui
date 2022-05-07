import {
  Directive, EventEmitter, HostBinding, HostListener, Input, Output, TemplateRef, ViewContainerRef,
} from '@angular/core';

@Directive({
  selector: '[ixDetailRow]',
})
export class IxDetailRowDirective<T = unknown> {
  @HostBinding('class.clickable-row')
  private row: T;
  private options: Record<string, unknown>;
  private templateRef: TemplateRef<unknown>;
  private opened: boolean;
  @Output() toggle = new EventEmitter<T>();

  @HostBinding('class.expanded')
  get expanded(): boolean {
    return this.opened;
  }

  @Input()
  set ixDetailRow(value: T) {
    if (value !== this.row) {
      this.row = value;
    }
  }

  get ixDetailRow(): T {
    return this.row;
  }

  @Input()
  set ixDetailRowOptions(value: Record<string, unknown>) {
    if (value !== this.options) {
      this.options = value;
    }
  }

  @Input()
  set ixDetailRowTemplate(value: TemplateRef<T>) {
    if (value !== this.templateRef) {
      this.templateRef = value;
    }
  }

  constructor(public viewContainerRef: ViewContainerRef) { }

  @HostListener('click')
  onClick(): void {
    if (this.opened) {
      this.close();
    } else {
      this.open();
    }
    this.toggle.emit(this.row);
  }

  open(): void {
    this.render();
    this.opened = this.viewContainerRef.length > 0;
  }

  close(): void {
    this.viewContainerRef.clear();
    this.opened = this.viewContainerRef.length > 0;
  }

  private render(): void {
    this.viewContainerRef.clear();
    if (this.templateRef && this.row) {
      this.viewContainerRef.createEmbeddedView(this.templateRef, { $implicit: this.row, ...this.options });
    }
  }
}
