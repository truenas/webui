import {
  AfterViewInit, ChangeDetectorRef, computed, Directive, ElementRef, inject, input, Renderer2,
  ViewChild,
} from '@angular/core';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/enclosure-mappings';

interface MouseEventsHandlers {
  mouseoverHandler: () => void;
  mouseoutHandler: () => void;
  clickHandler: () => void;
}

@Directive({
  selector: '[enclosureView]',
})
export class EnclosureViewDirective implements AfterViewInit {
  @ViewChild('mySvg') private viewSvg: ElementRef<HTMLObjectElement>;
  protected svgPath: string;
  readonly enclosure = input.required<DashboardEnclosure>();
  readonly viewOption = input.required<EnclosureSide>();
  private previousSelectRect: SVGRectElement;

  readonly viewSpecificSlots = computed(() => {
    const enclosure = this.enclosure();
    const viewOption = this.viewOption();
    const allSlots = Object.entries(enclosure.elements['Array Device Slot']);
    const slots: Record<number, DashboardEnclosureSlot> = {};
    let driveBayNumber = 1;
    switch (viewOption) {
      case EnclosureSide.Front:
        for (const slot of allSlots) {
          if (slot[1].is_front) {
            slots[driveBayNumber] = { ...slot[1], drive_bay_number: +slot[0] };
            driveBayNumber++;
          }
        }
        break;
      case EnclosureSide.Internal:
        for (const slot of allSlots) {
          if (slot[1].is_internal) {
            slots[driveBayNumber] = { ...slot[1], drive_bay_number: +slot[0] };
            driveBayNumber++;
          }
        }
        break;
      case EnclosureSide.Rear:
        for (const slot of allSlots) {
          if (slot[1].is_rear) {
            slots[driveBayNumber] = { ...slot[1], drive_bay_number: +slot[0] };
            driveBayNumber++;
          }
        }
        break;
      case EnclosureSide.Top:
        for (const slot of allSlots) {
          if (slot[1].is_top) {
            slots[driveBayNumber] = { ...slot[1], drive_bay_number: +slot[0] };
            driveBayNumber++;
          }
        }
        break;
    }
    return slots;
  });

  private enclosureStore: EnclosureStore = inject(EnclosureStore);
  private renderer: Renderer2 = inject(Renderer2);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  ngAfterViewInit(): void {
    this.enclosureStore.selectSlot(null);
    this.renderer.setAttribute(this.viewSvg.nativeElement, 'data', this.svgPath);
    this.cdr.markForCheck();
    const objElm = (this.viewSvg.nativeElement);
    this.viewSvg.nativeElement.onload = () => {
      const groupsList = objElm.contentDocument.querySelectorAll<SVGGElement>('g');

      let driveCageNumber = 1;
      const viewSpecificSlots = this.viewSpecificSlots();
      for (const group of groupsList) {
        if (!group.id.startsWith('DRIVE_CAGE_')) {
          continue;
        }

        if (viewSpecificSlots[driveCageNumber].dev == null) {
          this.renderer.setStyle(group, 'opacity', '0.5');
        }
        const {
          mouseoverHandler,
          mouseoutHandler,
          clickHandler,
        } = this.getMouseEventsHandlers(driveCageNumber, group);

        group.addEventListener('mouseover', mouseoverHandler);

        group.addEventListener('mouseout', mouseoutHandler);

        group.addEventListener('click', clickHandler);

        driveCageNumber++;
      }
    };
  }

  getMouseEventsHandlers(
    slotNumber: number,
    gElement: SVGGElement,
  ): MouseEventsHandlers {
    const highlightRect = this.createHighlightRect(gElement, slotNumber);
    const selectRect = this.createSelectRect(gElement);

    const mouseoutHandler = ((slotNo: number, grpEl: SVGGElement, borderedRect: SVGRectElement): void => {
      const viewSpecificSlots = this.viewSpecificSlots();
      this.renderer.removeChild(grpEl.parentNode, borderedRect);
      if (viewSpecificSlots[slotNo].dev == null) {
        return;
      }
      this.cdr.markForCheck();
    }).bind(this, slotNumber, gElement, highlightRect);

    const mouseoverHandler = ((grpEl: SVGGElement, borderedRect: SVGRectElement): void => {
      this.renderer.insertBefore(grpEl.parentNode, borderedRect, grpEl);
      this.cdr.markForCheck();
    }).bind(this, gElement, highlightRect);

    const clickHandler = ((slotNo: number) => {
      if (this.previousSelectRect) {
        this.renderer.removeChild(gElement.parentNode, this.previousSelectRect);
      }

      this.previousSelectRect = selectRect;
      this.renderer.insertBefore(gElement.parentNode, selectRect, gElement);
      this.onTraySelected(slotNo);
      this.cdr.markForCheck();
    }).bind(this, slotNumber);

    return {
      mouseoutHandler,
      mouseoverHandler,
      clickHandler,
    };
  }

  createHighlightRect(gElement: SVGGElement, slotNumber: number): SVGRectElement {
    const highlightRect = this.renderer.createElement('rect', 'http://www.w3.org/2000/svg') as SVGRectElement;
    const gRect = gElement.getBBox();

    this.renderer.setAttribute(highlightRect, 'width', `${gRect.width}`);
    this.renderer.setAttribute(highlightRect, 'height', `${gRect.height}`);
    this.renderer.setAttribute(highlightRect, 'x', `${gRect.x}`);
    this.renderer.setAttribute(highlightRect, 'y', `${gRect.y}`);
    this.renderer.setAttribute(highlightRect, 'stroke', '#ff3');
    this.renderer.setAttribute(highlightRect, 'stroke-width', '5px');
    this.renderer.setAttribute(highlightRect, 'stroke-dasharray', '5 10');
    this.renderer.setAttribute(highlightRect, 'id', `highlight_${slotNumber}`);
    return highlightRect;
  }

  createSelectRect(gElement: SVGGElement): SVGRectElement {
    const selectRect = this.renderer.createElement('rect', 'http://www.w3.org/2000/svg') as SVGRectElement;
    const gRect = gElement.getBBox();

    this.renderer.setAttribute(selectRect, 'width', `${gRect.width}`);
    this.renderer.setAttribute(selectRect, 'height', `${gRect.height}`);
    this.renderer.setAttribute(selectRect, 'x', `${gRect.x}`);
    this.renderer.setAttribute(selectRect, 'y', `${gRect.y}`);
    this.renderer.setAttribute(selectRect, 'stroke', '#ff3');
    this.renderer.setAttribute(selectRect, 'stroke-width', '5px');
    this.renderer.setAttribute(selectRect, 'id', 'select');
    return selectRect;
  }

  protected onTraySelected(slotNumber: number): void {
    const viewSpecificSlots = this.viewSpecificSlots();
    this.enclosureStore.selectSlot({ ...viewSpecificSlots[slotNumber] });
  }
}
