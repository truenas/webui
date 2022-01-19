import {
  Component, ViewChild, ViewContainerRef, ComponentFactoryResolver, HostBinding, Type, ComponentRef,
} from '@angular/core';

@Component({
  selector: 'display',
  template: '<ng-container #wrapper></ng-container>',
})
export class DisplayComponent<T = unknown> {
  displayList: T[] = []; // items in DOM
  children: ComponentRef<T>[] = [];
  @ViewChild('wrapper', { static: true }) wrapper: ViewContainerRef;
  @ViewChild('test', { static: true, read: ViewContainerRef }) test: ViewContainerRef;

  @HostBinding('class.hidden')
  isHidden = true;

  constructor(
    private resolver: ComponentFactoryResolver,
    private viewContainerRef: ViewContainerRef,
  ) {}

  create(component: Type<T>): T {
    const compRef = this.resolver.resolveComponentFactory(component).create(this.viewContainerRef.injector);
    this.children.push(compRef);
    return compRef.instance;
  }

  addChild(instance: T): void {
    const compRef = this.getChild(instance);

    // Insert into DOM
    this.viewContainerRef.insert(compRef.hostView);// addChild();

    // Setup ChangeDetection and add to DisplayList
    compRef.changeDetectorRef.detectChanges();
    this.displayList.push(instance);
  }

  removeChild(instance: T): void {
    const compRef = this.getChild(instance);

    // Remove from children
    const ci = this.children.indexOf(compRef);
    this.children.splice(ci, 1);

    // Remove from displayList
    const dli = this.displayList.indexOf(instance);
    this.displayList.splice(dli, 1);

    // Destroy component reference
    compRef.destroy();
  }

  getChild(instance: T): ComponentRef<T> {
    for (const item of this.children) {
      if (item.instance === instance) {
        return item;
      }
    }
  }
}
