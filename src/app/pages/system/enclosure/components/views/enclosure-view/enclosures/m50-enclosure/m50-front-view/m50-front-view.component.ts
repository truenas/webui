import { KeyValue } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, ElementRef, input, Renderer2, TrackByFunction,
  ViewChild,
} from '@angular/core';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

interface MouseEventsHandlers {
  mouseoverHandler: () => void;
  mouseoutHandler: () => void;
  clickHandler: () => void;
}

@Component({
  selector: 'ix-m50-front-view',
  templateUrl: './m50-front-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class M50FrontViewComponent implements AfterViewInit {
  @ViewChild('mySvg') viewSvg: ElementRef<HTMLObjectElement>;
  readonly enclosure = input.required<DashboardEnclosure>();
  private previousSelectRect: SVGRectElement;
  readonly selectedSlot = input.required<DashboardEnclosureSlot>();
  protected readonly selectedSlotIndex = computed(() => {
    const selectedSlot = this.selectedSlot();
    if (!selectedSlot) {
      return -1;
    }
    return selectedSlot.drive_bay_number - 1;
  });

  protected readonly trackByNumber: TrackByFunction<KeyValue<string, DashboardEnclosureSlot>> = (_, slot) => slot.key;

  protected readonly slots = computed<Record<number, DashboardEnclosureSlot>>(() => {
    const enclosure = this.enclosure();
    return enclosure.elements[EnclosureElementType.ArrayDeviceSlot];
  });

  protected isDriveCageEmpty(slotIndex: number): boolean {
    const slots = this.slots();
    const driveBayNumber = slotIndex + 1;
    return slots[driveBayNumber].dev == null;
  }

  constructor(
    private enclosureStore: EnclosureStore,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
  ) { }

  ngAfterViewInit(): void {
    const objElm = (this.viewSvg.nativeElement);
    this.viewSvg.nativeElement.onload = () => {
      const groupsList = objElm.contentDocument.querySelectorAll<SVGGElement>('g');

      let driveCageNumber = 1;
      const enclosure = this.enclosure();
      for (const group of groupsList) {
        if (!group.id.startsWith('DRIVE_CAGE_')) {
          continue;
        }

        if (enclosure.elements['Array Device Slot'][driveCageNumber].dev == null) {
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
      this.renderer.removeChild(grpEl.parentNode, borderedRect);
      if (this.enclosure().elements['Array Device Slot'][slotNo].dev == null) {
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
      this.onTraySelected(slotNo - 1);
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

  protected onTraySelected(slotIndex: number): void {
    const driveBayNumber = slotIndex + 1;
    const slots = this.slots();
    this.enclosureStore.selectSlot({ ...slots[driveBayNumber], drive_bay_number: driveBayNumber });
  }
}
