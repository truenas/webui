import {
  Directive, EventEmitter, HostBinding, HostListener, Input, Output, TemplateRef, ViewContainerRef,
} from '@angular/core';

@Directive({
  selector: '[ixDetailRow]',
})
export class IxDetailRowDirective<T = unknown> {
  private row: T;
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

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('ixDetailRowTpl')
  set template(value: TemplateRef<T>) {
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
      this.viewContainerRef.createEmbeddedView(this.templateRef, { $implicit: this.row });
    }
  }
}
