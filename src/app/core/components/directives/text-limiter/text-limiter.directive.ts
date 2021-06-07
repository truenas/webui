import { Overlay, OverlayRef, OverlayPositionBuilder } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  Directive, Input, AfterViewInit, ElementRef, HostListener, ComponentRef,
} from '@angular/core';
import { TextLimiterTooltipComponent } from './text-limiter-tooltip/text-limiter-tooltip.component';

@Directive({
  selector: '[textLimiter]',
})
export class TextLimiterDirective implements AfterViewInit {
  @Input() popup = true;
  @Input() threshold: number;
  private defaultThreshold = 10;
  private overlayRef: OverlayRef;

  private rawText = '';
  private text = '';

  @HostListener('mouseenter')
  show(): void {
    if (!this.popup) return;
    if (this.text !== this.rawText) {
      // Create tooltip portal
      const tooltipPortal = new ComponentPortal(TextLimiterTooltipComponent);

      // Attach tooltip portal to overlay
      const tooltipRef: ComponentRef<TextLimiterTooltipComponent> = this.overlayRef.attach(tooltipPortal);

      // Pass content to tooltip component instance
      tooltipRef.instance.text = this.rawText;
    }
  }

  @HostListener('mouseout')
  hide(): void {
    if (!this.popup) return;
    this.overlayRef.detach();
  }

  constructor(private el: ElementRef, private overlayPositionBuilder: OverlayPositionBuilder, private overlay: Overlay) {
  }

  ngAfterViewInit(): void {
    this.rawText = this.el.nativeElement.innerText;
    this.text = this.truncate(this.rawText);
    this.el.nativeElement.innerText = this.text;
    this.overlayRef = this.overlay.create({});

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

  truncate(str: string): string {
    if (str.length > this.threshold) {
      const truncated = str.substring(0, this.threshold - 3);
      return truncated + '...';
    }
    return str;
  }
}
