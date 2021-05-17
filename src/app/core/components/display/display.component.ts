import {
  Component, ViewChild, OnInit, AfterViewInit, Input, Renderer2, ViewContainerRef, ComponentRef, ComponentFactory, ComponentFactoryResolver,
} from '@angular/core';
import { LayoutContainer, LayoutChild } from 'app/core/classes/layouts';
import { ViewConfig } from 'app/core/components/viewcontroller/viewcontroller.component';
import { Subject } from 'rxjs';

@Component({
  selector: 'display',
  template: '<ng-container #wrapper></ng-container>',
  host: { class: 'hidden' },
})
export class Display implements OnInit, AfterViewInit {
  displayList: any[] = []; // items in DOM
  children: any[] = [];
  @ViewChild('wrapper', { static: true }) wrapper: ViewContainerRef;
  @ViewChild('test', { static: true, read: ViewContainerRef }) test: ViewContainerRef;

  constructor(private resolver: ComponentFactoryResolver, private viewContainerRef: ViewContainerRef, private renderer: Renderer2) {
  }

  ngOnInit() {}

  ngAfterViewInit() {
  }

  create(component: any) {
    const compRef = <any> this.resolver.resolveComponentFactory(component).create(this.viewContainerRef.injector);
    this.children.push(compRef);
    return compRef.instance;
  }

  addChild(instance: any) {
    const compRef = this.getChild(instance);

    // Insert into DOM
    this.viewContainerRef.insert(compRef.hostView);// addChild();

    // Deal with component's selector element
    const container = this.viewContainerRef.element.nativeElement;

    // Setup ChangeDetection and add to DisplayList
    compRef.changeDetectorRef.detectChanges();
    this.displayList.push(instance);
  }

  private moveContents(compRef: any, container: any) {
    const selector = compRef.hostView.rootNodes['0'];
    const contents = compRef.hostView.rootNodes['0'].childNodes;
    let node: any;

    for (let i = 0; i < contents.length; i++) {
      if (contents[i].tagName == 'MD-CARD') {
        this.renderer.appendChild(container, contents[i]);
        this.renderer.removeChild(container, selector);
      }
    }
  }

  removeChild(instance: any) {
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

  getChild(instance: any) {
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].instance == instance) {
        return this.children[i];
      }
    }
  }
}
