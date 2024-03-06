import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, ViewChild, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GlobalSearchComponent } from 'app/modules/global-search/components/global-search/global-search.component';

@UntilDestroy()
@Component({
  selector: 'ix-global-search-trigger',
  templateUrl: './global-search-trigger.component.html',
  styleUrls: ['./global-search-trigger.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalTriggerSearchComponent implements AfterViewInit {
  @ViewChild('searchInput') searchInput: ElementRef<HTMLInputElement>;

  overlayRef: OverlayRef;

  constructor(
    private cdr: ChangeDetectorRef,
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngAfterViewInit(): void {
    this.prepareOverlay();
  }

  prepareOverlay(): void {
    const overlayConfig = new OverlayConfig({
      hasBackdrop: true,
      backdropClass: ['cdk-overlay-backdrop', 'cdk-overlay-dark-backdrop'],
      panelClass: ['topbar-panel'],
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    this.overlayRef = this.overlay.create(overlayConfig);

    // Close overlay on backdrop click
    this.overlayRef.backdropClick().pipe(untilDestroyed(this)).subscribe(() => this.detachOverlay());
  }

  showOverlay(): void {
    if (this.overlayRef.hasAttached()) {
      return;
    }

    const searchResultsPortal = new ComponentPortal(GlobalSearchComponent, this.viewContainerRef);
    const componentRef = this.overlayRef.attach(searchResultsPortal);
    componentRef.instance.resetSearch.pipe(untilDestroyed(this)).subscribe(() => this.detachOverlay());
    this.cdr.markForCheck();
  }

  detachOverlay(): void {
    this.overlayRef.detach();
    this.searchInput.nativeElement.blur();
    (this.document.querySelector('ix-logo a') as unknown as HTMLLinkElement).focus();
    this.cdr.markForCheck();
  }
}
