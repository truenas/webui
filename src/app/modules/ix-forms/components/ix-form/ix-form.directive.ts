import { AfterViewInit, Directive, ElementRef, OnDestroy, ViewContainerRef } from "@angular/core";

export abstract class IxFormControl implements AfterViewInit, OnDestroy {

  getIsVisible() {
    return this.isVisible;
  }

  private isVisible: boolean = false;
  private observer: IntersectionObserver | undefined;

  constructor(
    public elementRef: ElementRef<HTMLElement>,
    private viewContainerRef: ViewContainerRef,
    ixFormDirective: IxFormDirective | undefined,
  ) {
    ixFormDirective?.registerControl(this);
  }

  ngAfterViewInit() {
    const observedElement = this.viewContainerRef.element.nativeElement.parentElement;
    this.observer = new IntersectionObserver(([entry]) => {
      this.isVisible = entry.isIntersecting;
    })
    this.observer.observe(observedElement);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}

@Directive({
  selector: 'form'
})
export class IxFormDirective {
  
  private controls: IxFormControl[] = [];
  
  getControls() { return this.controls; }

  registerControl(control: IxFormControl) {
    this.controls.push(control);
  }
}