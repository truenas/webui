import {
  AfterViewInit, ChangeDetectorRef, computed, Directive, ElementRef, inject, input, OnChanges, Renderer2,
  ViewChild,
} from '@angular/core';
import { DashboardEnclosure, DashboardEnclosureSlotColored } from 'app/interfaces/enclosure.interface';
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
export class EnclosureViewDirective implements AfterViewInit, OnChanges {
  @ViewChild('mySvg') private viewSvg: ElementRef<HTMLObjectElement>;
  protected svgPath: string;
  readonly enclosure = input.required<DashboardEnclosure>();
  readonly enclosureSide = input.required<EnclosureSide>();
  private previousSelectRect: SVGRectElement;
  private isViewReady = false;

  readonly viewSpecificSlots = computed(() => {
    const enclosure = this.enclosure();
    const viewOption = this.enclosureSide();
    const allSlots = Object.entries(enclosure.elements['Array Device Slot']);
    const slots: Record<number, DashboardEnclosureSlotColored> = {};
    const boxSideToFlagMap: { [key in EnclosureSide]: 'is_front' | 'is_internal' | 'is_rear' | 'is_top' } = {
      [EnclosureSide.Front]: 'is_front',
      [EnclosureSide.Internal]: 'is_internal',
      [EnclosureSide.Rear]: 'is_rear',
      [EnclosureSide.Top]: 'is_top',
    };

    const flagProp = boxSideToFlagMap[viewOption];
    for (const slot of allSlots) {
      if (slot[1][flagProp]) {
        slots[+slot[0]] = { ...slot[1], drive_bay_number: +slot[0] };
      }
    }

    return slots;
  });

  private enclosureStore: EnclosureStore = inject(EnclosureStore);
  private renderer: Renderer2 = inject(Renderer2);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  ngOnChanges(): void {
    if (this.isViewReady) {
      this.ngAfterViewInit();
    }
  }

  ngAfterViewInit(): void {
    this.isViewReady = true;
    this.enclosureStore.selectSlot(null);
    this.renderer.setAttribute(this.viewSvg.nativeElement, 'data', this.svgPath);
    this.cdr.markForCheck();
    const objElm = (this.viewSvg.nativeElement);
    this.viewSvg.nativeElement.onload = () => {
      const groupsList = objElm.contentDocument.querySelectorAll<SVGGElement>('g');

      const viewSpecificSlots = this.viewSpecificSlots();
      const slotsEntries = Object.entries(viewSpecificSlots);
      const slots = slotsEntries.sort((a, b) => {
        if (+a[0] > +b[0]) {
          return 1;
        }
        if (+a[0] < +b[0]) {
          return -1;
        }
        return 0;
      }).map((entry) => entry[1]);
      let slotIndex = 0;
      for (const group of groupsList) {
        if (!group.id.startsWith('DRIVE_CAGE_')) {
          continue;
        }

        if (slots[slotIndex].dev == null) {
          this.renderer.setStyle(group, 'opacity', '0.5');
        }

        if (slots[slotIndex].highlightColor != null) {
          this.addTintRect(group, slots[slotIndex].drive_bay_number);
        }

        const {
          mouseoverHandler,
          mouseoutHandler,
          clickHandler,
        } = this.getMouseEventsHandlers(slots[slotIndex].drive_bay_number, group);

        group.addEventListener('mouseover', mouseoverHandler);

        group.addEventListener('mouseout', mouseoutHandler);

        group.addEventListener('click', clickHandler);

        slotIndex++;
      }
    };
  }

  addTintRect(gElement: SVGGElement, slotNumber: number): void {
    const poolColoredRect = this.createTintRect(
      gElement,
      slotNumber,
    );
    this.renderer.insertBefore(gElement.parentNode, poolColoredRect, gElement.nextElementSibling);
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

    const clickHandler = ((slotNo: number, selectHighlightRect: SVGRectElement) => {
      if (this.previousSelectRect) {
        this.renderer.removeChild(gElement.parentNode, this.previousSelectRect);
      }

      this.previousSelectRect = selectHighlightRect;
      this.renderer.insertBefore(gElement.parentNode, selectHighlightRect, gElement);
      this.onTraySelected(slotNo);
      this.cdr.markForCheck();
    }).bind(this, slotNumber, selectRect);

    return {
      mouseoutHandler,
      mouseoverHandler,
      clickHandler,
    };
  }

  createTintRect(gElement: SVGGElement, slotNumber: number): SVGRectElement {
    const highlightRect = this.renderer.createElement('rect', 'http://www.w3.org/2000/svg') as SVGRectElement;
    const gRect = gElement.getBBox();

    this.renderer.setAttribute(highlightRect, 'width', `${gRect.width}`);
    this.renderer.setAttribute(highlightRect, 'height', `${gRect.height}`);
    this.renderer.setAttribute(highlightRect, 'x', `${gRect.x}`);
    this.renderer.setAttribute(highlightRect, 'y', `${gRect.y}`);
    this.renderer.setAttribute(highlightRect, 'opacity', '0.3');
    this.renderer.setAttribute(highlightRect, 'pointer-events', 'none');
    this.renderer.setAttribute(highlightRect, 'fill', this.viewSpecificSlots()[slotNumber].highlightColor);
    this.renderer.setAttribute(highlightRect, 'id', `highlight_tint_${slotNumber}`);
    return highlightRect;
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
    this.renderer.setAttribute(selectRect, 'stroke-width', '10px');
    this.renderer.setAttribute(selectRect, 'id', 'select');
    return selectRect;
  }

  protected onTraySelected(slotNumber: number): void {
    const viewSpecificSlots = this.viewSpecificSlots();
    this.enclosureStore.selectSlot({ ...viewSpecificSlots[slotNumber] });
  }
}
