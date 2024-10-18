import {
  animate, style, transition, trigger,
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  model,
  OnDestroy,
  Renderer2,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { delay } from 'rxjs';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { SvgCacheService } from 'app/pages/system/enclosure/services/svg-cache.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

export type TintingFunction = (slot: DashboardEnclosureSlot | null) => string | null;

@UntilDestroy()
@Component({
  selector: 'ix-enclosure-svg',
  templateUrl: './enclosure-svg.component.html',
  styleUrls: ['./enclosure-svg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('svgTransition', [
      transition(':enter', [
        style({ opacity: 0, height: '*' }),
        animate('300ms ease-in', style({ opacity: 1, height: '*' })),
      ]),
    ]),
  ],
  standalone: true,
  imports: [NgxSkeletonLoaderModule],
})
export class EnclosureSvgComponent implements OnDestroy {
  readonly svgUrl = input.required<string>();
  readonly slots = input<DashboardEnclosureSlot[]>();
  readonly enableMouseEvents = input(true);
  readonly slotTintFn = input<TintingFunction>();
  readonly selectedSlot = model<DashboardEnclosureSlot | null>(null);

  private keyDownListener: () => void;
  private clickListener: () => void;

  protected svg = signal<SafeHtml | undefined>(undefined);
  protected svgContainer = viewChild<ElementRef<HTMLElement>>('svgContainer');

  private overlayRects: Record<number, SVGRectElement> = {};

  constructor(
    private renderer: Renderer2,
    private svgLoader: SvgCacheService,
    private errorHandler: ErrorHandlerService,
    private sanitizer: DomSanitizer,
    private translate: TranslateService,
  ) {}

  ngOnDestroy(): void {
    if (this.keyDownListener) {
      this.keyDownListener();
    }
    if (this.clickListener) {
      this.clickListener();
    }
  }

  // TODO: Consider building and using asyncComputed.
  protected loadSvg = effect(() => {
    this.svg.set(undefined);
    this.svgLoader
      .loadSvg(this.svgUrl())
      .pipe(
        this.errorHandler.catchError(),
        delay(0),
        untilDestroyed(this),
      )
      .subscribe((svg) => {
        // eslint-disable-next-line sonarjs/no-angular-bypass-sanitization
        this.svg.set(this.sanitizer.bypassSecurityTrustHtml(svg));
      });
  }, { allowSignalWrites: true });

  protected processSvg = effect(() => {
    if (!this.svgContainer() || !this.svg()) {
      return;
    }

    const driveTrays = this.svgContainer().nativeElement.querySelectorAll<SVGGElement>('svg [id^="DRIVE_CAGE_"]');
    this.clearOverlays();

    // TODO: Unclear if input change will trigger re-render.
    driveTrays.forEach((tray) => {
      const slot = this.getSlotForTray(tray);
      if (!slot) {
        return;
      }

      this.addOverlay(slot, tray);

      if (this.enableMouseEvents()) {
        this.addInteractionListeners(slot);
      }

      if (this.slotTintFn()) {
        this.addTint(slot);
      }
    });
  });

  private highlightSelectedSlot = effect(() => {
    const selectedSlot = this.selectedSlot();
    const slots = this.slots();
    const svg = this.svg();

    this.clearSelectionStylesFromAllSlots();

    if (!selectedSlot || !svg) {
      return;
    }

    this.addSelectedStyles(selectedSlot);
    this.addSelectedVdevDisksStyles(selectedSlot, slots);
  });

  private clearSelectionStylesFromAllSlots(): void {
    Object.values(this.overlayRects).forEach((overlay) => {
      overlay.classList.remove('selected');
      overlay.classList.remove('selected-vdev-disk');
      overlay.classList.remove('not-selected-vdev-disk');
    });
  }

  private addSelectedStyles(selectedSlot: DashboardEnclosureSlot): void {
    const slotOverlay = this.overlayRects[selectedSlot.drive_bay_number];
    this.renderer.addClass(slotOverlay, 'selected');
  }

  private addSelectedVdevDisksStyles(
    selectedSlot: DashboardEnclosureSlot,
    allSlots: DashboardEnclosureSlot[],
  ): void {
    const selectedVdevDisks = selectedSlot.pool_info?.vdev_disks.map(
      (diskInfo) => diskInfo.dev,
    ).filter(
      (disk) => disk !== selectedSlot.dev,
    );

    if (!selectedVdevDisks?.length) {
      return;
    }

    for (const slot of allSlots) {
      if (selectedVdevDisks.includes(slot.dev)) {
        this.renderer.addClass(this.overlayRects[slot.drive_bay_number], 'selected-vdev-disk');
      } else if (slot.drive_bay_number !== selectedSlot.drive_bay_number) {
        this.renderer.addClass(this.overlayRects[slot.drive_bay_number], 'not-selected-vdev-disk');
      }
    }
  }

  private clearOverlays(): void {
    Object.values(this.overlayRects).forEach((overlay) => overlay.remove());
    this.overlayRects = {};
  }

  private addOverlay(slot: DashboardEnclosureSlot, tray: SVGGElement): void {
    const overlayRect = this.renderer.createElement('rect', 'http://www.w3.org/2000/svg') as SVGRectElement;
    this.renderer.appendChild(tray.parentNode, overlayRect);
    const trayRect = tray.getBBox();

    this.renderer.addClass(overlayRect, 'overlay-rect');
    this.renderer.setAttribute(overlayRect, 'width', `${trayRect.width}`);
    this.renderer.setAttribute(overlayRect, 'height', `${trayRect.height}`);
    this.renderer.setAttribute(overlayRect, 'x', `${trayRect.x}`);
    this.renderer.setAttribute(overlayRect, 'y', `${trayRect.y}`);

    this.overlayRects[slot.drive_bay_number] = overlayRect;
  }

  private handleOverlayKeyNavigation(event: KeyboardEvent, slot: DashboardEnclosureSlot): void {
    switch (event.key) {
      case 'Enter':
        this.slotSelected(slot);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        this.moveFocusToNeighboringOverlay(slot, 0, -1);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        this.moveFocusToNeighboringOverlay(slot, 0, 1);
        break;
    }
  }

  private moveFocusToNeighboringOverlay(
    currentSlot: DashboardEnclosureSlot,
    rowOffset: number,
    colOffset: number,
  ): void {
    const currentDriveBayNumber = currentSlot.drive_bay_number;
    const targetDriveBayNumber = currentDriveBayNumber + colOffset + rowOffset;
    const targetOverlay = this.overlayRects[targetDriveBayNumber];

    if (targetOverlay) {
      targetOverlay.focus();
    }
  }

  private addInteractionListeners(slot: DashboardEnclosureSlot): void {
    const overlay = this.overlayRects[slot.drive_bay_number];

    this.clickListener = this.renderer.listen(overlay, 'click', this.slotSelected.bind(this, slot));

    this.keyDownListener = this.renderer.listen(
      overlay,
      'keydown',
      (event: KeyboardEvent) => this.handleOverlayKeyNavigation(event, slot),
    );

    this.renderer.setAttribute(overlay, 'tabindex', '0');

    this.renderer.setAttribute(
      overlay,
      'aria-label',
      this.translate.instant('Disk Details for {disk} ({descriptor})', {
        disk: slot.dev || this.translate.instant('Empty drive cage'),
        descriptor: slot.descriptor,
      }),
    );
  }

  slotSelected = (slot: DashboardEnclosureSlot): void => {
    const selectedSlot = this.selectedSlot();
    const isNewSlotEmpty = !slot.dev;
    const prevSlotExists = !!selectedSlot;

    if (!isNewSlotEmpty && prevSlotExists && slot.dev === selectedSlot.dev) {
      this.selectedSlot.set(null);
      return;
    }

    this.selectedSlot.set(slot);
  };

  private addTint(slot: DashboardEnclosureSlot): void {
    const overlay = this.overlayRects[slot.drive_bay_number];

    this.renderer.removeClass(overlay, 'tinted');

    const slotTint = this.slotTintFn()(slot);
    if (!slotTint) {
      return;
    }

    this.renderer.addClass(overlay, 'tinted');
    this.renderer.setStyle(overlay, 'fill', slotTint);
  }

  private getSlotForTray(tray: SVGGElement): DashboardEnclosureSlot {
    const slotNumber = Number(tray.id.split('_').pop());
    const traySlot = this.slots().find((slot) => slot.drive_bay_number === slotNumber);

    if (!traySlot) {
      console.error(`Slot ${slotNumber} not found in slots list`);
      return undefined;
    }

    return traySlot;
  }
}
