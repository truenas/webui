import { Directive, OnInit, Input, ElementRef, Renderer2, HostListener } from '@angular/core';

/*
 * This directive hides elements with the provided selector
 * when they are out of view
 * */

@Directive({
  selector: '[lazyViewer]'
})
export class LazyViewerDirective  implements OnInit{

  @Input() container?: string;
  @Input() view?: string;

  constructor(private renderer: Renderer2, private el: ElementRef) { 
  }

  ngOnInit(){
    console.log(this.view);
    console.log(this.el);
  }

  @HostListener('mouseenter') onMouseEnter() {
    //console.log(this.el.nativeElement.querySelectorAll(this.view));
  }
 
  @HostListener('mouseleave') onMouseLeave() {
  }

}
