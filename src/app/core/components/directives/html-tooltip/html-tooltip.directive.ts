import { Overlay, OverlayRef, OverlayPositionBuilder } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  Directive, Input, AfterViewInit, ElementRef, HostListener, ComponentRef, OnDestroy,
} from '@angular/core';
import { HtmlTooltipComponent } from 'app/core/components/directives/html-tooltip/html-tooltip.component';

@Directive({
  selector: '[htmlTooltip]',
})
export class HtmlTooltipDirective implements AfterViewInit, OnDestroy {
  @Input() htmlTooltip: string;
  private overlayRef: OverlayRef;

  @HostListener('mouseenter') show(): void {
    // Create tooltip portal
    const tooltipPortal = new ComponentPortal(HtmlTooltipComponent);

    // Attach tooltip portal to overlay
    const tooltipRef: ComponentRef<HtmlTooltipComponent> = this.overlayRef.attach(tooltipPortal);

    // Pass content to tooltip component instance
    tooltipRef.instance.html = this.htmlTooltip;
  }

  @HostListener('mouseout') hide(): void {
    this.overlayRef.detach();
  }

  constructor(
    private el: ElementRef,
    private overlayPositionBuilder: OverlayPositionBuilder,
    private overlay: Overlay,
  ) {}

  ngAfterViewInit(): void {
    const positionStrategy = this.overlayPositionBuilder
      // Create position attached to the elementRef
      .flexibleConnectedTo(this.el)
      // Describe how to connect overlay to the elementRef
      // Means, attach overlay's center bottom point to the
      // top center point of the elementRef.
      .withPositions([{
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'bottom',
      }]);

    // Connect position strategy
    this.overlayRef = this.overlay.create({ positionStrategy });
  }

  ngOnDestroy(): void {
    this.overlayRef.detach();
    this.overlayRef.dispose();
  }
}
