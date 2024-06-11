import { KeyValue } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy, Component, computed, ElementRef, input, Renderer2, TrackByFunction,
  ViewChild,
} from '@angular/core';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-m50-front-view',
  templateUrl: './m50-front-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class M50FrontViewComponent implements AfterViewInit {
  @ViewChild('mySvg') viewSvg: ElementRef<HTMLObjectElement>;
  readonly enclosure = input.required<DashboardEnclosure>();
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

        const mouseoverEventHandler = ((gElement: SVGGElement): void => {
          this.renderer.setStyle(gElement, 'opacity', '0.5');
        }).bind(this, group);

        group.addEventListener('mouseover', mouseoverEventHandler);

        const mouseoutEventHandler = ((slotNumber: number, gElement: SVGGElement): void => {
          if (enclosure.elements['Array Device Slot'][slotNumber].dev == null) {
            return;
          }
          this.renderer.setStyle(gElement, 'opacity', '1');

          const rect = this.renderer.createElement('rect', 'http://www.w3.org/2000/svg') as SVGRectElement;
          const gRect = gElement.getBoundingClientRect();
          this.renderer.setAttribute(rect, 'width', `${gRect.width}`);
          this.renderer.setAttribute(rect, 'height', `${gRect.height}`);
          this.renderer.setAttribute(rect, 'x', `${gRect.left}`);
          this.renderer.setAttribute(rect, 'y', `${gRect.top}`);
          this.renderer.setAttribute(rect, 'stroke', 'red');
          this.renderer.setAttribute(rect, 'stroke-width', '3px');

          this.renderer.insertBefore(gElement.parentNode, rect, gElement);
        }).bind(this, driveCageNumber, group);
        group.addEventListener('mouseout', mouseoutEventHandler);

        driveCageNumber++;
      }
    };
  }

  protected onTraySelected(slotIndex: number): void {
    const driveBayNumber = slotIndex + 1;
    const slots = this.slots();
    this.enclosureStore.selectSlot({ ...slots[driveBayNumber], drive_bay_number: driveBayNumber });
  }
}
