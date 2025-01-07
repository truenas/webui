import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  ViewContainerRef,
} from '@angular/core';
import { MatInput } from '@angular/material/input';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { delay, take } from 'rxjs';
import { GlobalSearchComponent } from 'app/modules/global-search/components/global-search/global-search.component';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { KeyboardShortcutComponent } from 'app/modules/keyboard-shortcut/keyboard-shortcut.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { FocusService } from 'app/services/focus.service';

@UntilDestroy()
@Component({
  selector: 'ix-global-search-trigger',
  templateUrl: './global-search-trigger.component.html',
  styleUrls: ['./global-search-trigger.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
    MatInput,
    TestDirective,
    KeyboardShortcutComponent,
    TranslateModule,
  ],
})
export class GlobalSearchTriggerComponent implements AfterViewInit {
  protected overlayRef: OverlayRef | undefined;

  constructor(
    private cdr: ChangeDetectorRef,
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
    private searchProvider: UiSearchProvider,
    private focusService: FocusService,
  ) {}

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

    this.overlayRef.backdropClick().pipe(untilDestroyed(this)).subscribe(() => this.detachOverlayAndFocusMainContent());
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
      .pipe(take(1), delay(searchDelayConst), untilDestroyed(this))
      .subscribe(() => this.detachOverlayAndFocusMainContent());
  }

  @HostListener('document:keydown.escape')
  private detachOverlayAndFocusMainContent(): void {
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
