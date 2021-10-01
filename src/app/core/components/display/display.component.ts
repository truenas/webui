import {
  Component, ViewChild, Renderer2, ViewContainerRef, ComponentFactoryResolver, HostBinding, Type,
} from '@angular/core';

@Component({
  selector: 'display',
  template: '<ng-container #wrapper></ng-container>',
})
export class DisplayComponent {
  displayList: any[] = []; // items in DOM
  children: any[] = [];
  @ViewChild('wrapper', { static: true }) wrapper: ViewContainerRef;
  @ViewChild('test', { static: true, read: ViewContainerRef }) test: ViewContainerRef;

  @HostBinding('class.hidden')
  isHidden = true;

  constructor(
    private resolver: ComponentFactoryResolver,
    private viewContainerRef: ViewContainerRef,
    private renderer: Renderer2,
  ) {}

  create(component: Type<any>): any {
    const compRef = this.resolver.resolveComponentFactory(component).create(this.viewContainerRef.injector);
    this.children.push(compRef);
    return compRef.instance;
  }

  addChild(instance: any): void {
    const compRef = this.getChild(instance);

    // Insert into DOM
    this.viewContainerRef.insert(compRef.hostView);// addChild();

    // Setup ChangeDetection and add to DisplayList
    compRef.changeDetectorRef.detectChanges();
    this.displayList.push(instance);
  }

  private moveContents(compRef: any, container: any): void {
    const selector = compRef.hostView.rootNodes['0'];
    const contents = compRef.hostView.rootNodes['0'].childNodes;

    for (const node of contents) {
      if (node.tagName == 'MD-CARD') {
        this.renderer.appendChild(container, node);
        this.renderer.removeChild(container, selector);
      }
    }
  }

  removeChild(instance: any): void {
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

  getChild(instance: any): any {
    for (const item of this.children) {
      if (item.instance == instance) {
        return item;
      }
    }
  }
}
