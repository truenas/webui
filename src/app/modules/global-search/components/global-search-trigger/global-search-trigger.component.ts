import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, HostListener, ViewContainerRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatInput } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { delay, take } from 'rxjs';
import { GlobalSearchComponent } from 'app/modules/global-search/components/global-search/global-search.component';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { KeyboardShortcutComponent } from 'app/modules/keyboard-shortcut/keyboard-shortcut.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { FocusService } from 'app/services/focus.service';

@Component({
  selector: 'ix-global-search-trigger',
  templateUrl: './global-search-trigger.component.html',
  styleUrls: ['./global-search-trigger.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
    MatInput,
    TestDirective,
    KeyboardShortcutComponent,
    TranslateModule,
  ],
})
export class GlobalSearchTriggerComponent implements AfterViewInit {
  private cdr = inject(ChangeDetectorRef);
  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private searchProvider = inject(UiSearchProvider);
  private focusService = inject(FocusService);
  private destroyRef = inject(DestroyRef);

  protected overlayRef: OverlayRef | undefined;

  ngAfterViewInit(): void {
    this.prepareOverlay();
  }

  private prepareOverlay(): void {
    const overlayConfig = new OverlayConfig({
      hasBackdrop: true,
      backdropClass: ['cdk-overlay-backdrop', 'cdk-overlay-dark-backdrop'],
      panelClass: ['topbar-panel'],
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    this.overlayRef = this.overlay.create(overlayConfig);

    this.overlayRef.backdropClick().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.detachOverlayAndFocusMainContent());
  }

  protected showOverlay(): void {
    if (!this.overlayRef || this.overlayRef.hasAttached()) {
      return;
    }

    const searchResultsPortal = new ComponentPortal(GlobalSearchComponent, this.viewContainerRef);
    const componentRef = this.overlayRef.attach(searchResultsPortal);
    componentRef.instance.detachOverlay = this.detachOverlay.bind(this);

    this.cdr.markForCheck();

    this.searchProvider.selectionChanged$
      .pipe(take(1), delay(searchDelayConst), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.detachOverlayAndFocusMainContent());
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected detachOverlayAndFocusMainContent(event?: Event): void {
    if (!this.overlayRef?.hasAttached()) {
      return;
    }

    event?.preventDefault();
    event?.stopPropagation();
    this.detachOverlay();
    this.focusService.focusFirstFocusableElement(document.querySelector('main'));
  }

  private detachOverlay(): void {
    if (!this.overlayRef?.hasAttached()) {
      return;
    }
    this.overlayRef.detach();
    this.cdr.markForCheck();
  }
}
