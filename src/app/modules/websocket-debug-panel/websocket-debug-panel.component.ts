import { AsyncPipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, HostListener, OnDestroy, Renderer2, ChangeDetectorRef, NgZone, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { EnclosureMockTabComponent } from './components/enclosure-mock-tab/enclosure-mock-tab.component';
import { MockConfigurationsTabComponent } from './components/mock-configurations-tab/mock-configurations-tab.component';
import { WebSocketTabComponent } from './components/websocket-tab/websocket-tab.component';
import { storageKeys } from './constants';
import * as WebSocketDebugActions from './store/websocket-debug.actions';
import {
  selectIsPanelOpen, selectActiveTab, selectHasActiveMocks,
} from './store/websocket-debug.selectors';
import { safeGetItem } from './utils/local-storage-utils';

@UntilDestroy()
@Component({
  selector: 'ix-websocket-debug-panel',
  standalone: true,
  imports: [
    AsyncPipe,
    MatTabsModule,
    MatButtonModule,
    IxIconComponent,
    WebSocketTabComponent,
    MockConfigurationsTabComponent,
    EnclosureMockTabComponent,
  ],
  providers: [],
  templateUrl: './websocket-debug-panel.component.html',
  styleUrls: ['./websocket-debug-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebSocketDebugPanelComponent implements OnInit, OnDestroy {
  private store$ = inject(Store);
  private renderer = inject(Renderer2);
  private document = inject<Document>(DOCUMENT);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  readonly isPanelOpen$ = this.store$.select(selectIsPanelOpen);
  readonly activeTab$ = this.store$.select(selectActiveTab);
  readonly hasActiveMocks$ = this.store$.select(selectHasActiveMocks);
  readonly selectedTabIndex$ = this.activeTab$.pipe(
    map((tab) => {
      if (tab === 'websocket') {
        return 0;
      }
      if (tab === 'mock-configurations') {
        return 1;
      }
      if (tab === 'enclosure-mock') {
        return 2;
      }
      return 0;
    }),
  );

  protected panelWidth = 550;
  private isPanelOpen = false;
  private mutationObserver: MutationObserver | null = null;

  ngOnInit(): void {
    // Load saved mock configs and restore panel state
    this.store$.dispatch(WebSocketDebugActions.loadMockConfigs());
    this.store$.dispatch(WebSocketDebugActions.loadEnclosureMockConfig());

    // Ensure EnclosureMockService starts listening after configs are loaded
    // The service is injected in constructor, so it's already created

    // Set up MutationObserver to watch for admin layout element
    this.setupMutationObserver();

    // Restore panel state from localStorage asynchronously
    this.ngZone.runOutsideAngular(() => {
      Promise.resolve().then(() => {
        const isOpen = safeGetItem<boolean>(storageKeys.PANEL_OPEN, false);
        if (isOpen) {
          this.ngZone.run(() => {
            this.store$.dispatch(WebSocketDebugActions.setPanelOpen({ isOpen }));
            // Immediately try to update margin when restoring panel state
            this.updateAdminLayoutMargin(true);
          });
        }
      });
    });

    // Manage body margin when panel opens/closes
    this.isPanelOpen$.pipe(untilDestroyed(this)).subscribe((isOpen) => {
      this.isPanelOpen = isOpen;
      this.updateAdminLayoutMargin(isOpen);
    });
  }

  private setupMutationObserver(): void {
    // Set up a MutationObserver to watch for the admin layout element
    // This ensures we catch it even if it's added dynamically after initial load
    this.ngZone.runOutsideAngular(() => {
      if (this.mutationObserver) {
        return; // Already set up
      }

      this.mutationObserver = new MutationObserver(() => {
        // Check if admin layout has been added to DOM
        const adminLayout = this.document.querySelector('.fn-maincontent');
        if (adminLayout && this.isPanelOpen) {
          // Apply margin if panel is open
          this.updateAdminLayoutMargin(true);
          // Disconnect observer once we've found and updated the element
          this.mutationObserver?.disconnect();
          this.mutationObserver = null;
        }
      });

      // Start observing the document body for child additions
      this.mutationObserver.observe(this.document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  private updateAdminLayoutMargin(isOpen: boolean, retryCount = 0): void {
    // Run outside Angular to avoid unnecessary change detection
    this.ngZone.runOutsideAngular(() => {
      const adminLayout = this.document.querySelector('.fn-maincontent') as HTMLElement;
      if (adminLayout) {
        if (isOpen) {
          this.renderer.setStyle(adminLayout, 'margin-right', `${this.panelWidth}px`);
          this.renderer.setStyle(adminLayout, 'transition', 'margin-right 300ms cubic-bezier(0.4, 0, 0.2, 1)');
        } else {
          this.renderer.removeStyle(adminLayout, 'margin-right');
          this.renderer.removeStyle(adminLayout, 'transition');
        }
        // Disconnect mutation observer if it's still watching
        if (this.mutationObserver) {
          this.mutationObserver.disconnect();
          this.mutationObserver = null;
        }
      } else if (isOpen && retryCount < 50) {
        // If admin layout is not found yet and panel should be open, try again
        // Increase retry count and use a small delay for page load scenarios
        setTimeout(() => {
          this.updateAdminLayoutMargin(isOpen, retryCount + 1);
        }, 100);
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up body margin on destroy
    const adminLayout = this.document.querySelector('.fn-maincontent') as HTMLElement;
    if (adminLayout) {
      this.renderer.removeStyle(adminLayout, 'margin-right');
      this.renderer.removeStyle(adminLayout, 'transition');
    }

    // Clean up MutationObserver
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  onTabChange(index: number): void {
    let tab: 'websocket' | 'mock-configurations' | 'enclosure-mock' = 'websocket';
    if (index === 1) {
      tab = 'mock-configurations';
    } else if (index === 2) {
      tab = 'enclosure-mock';
    }
    this.store$.dispatch(WebSocketDebugActions.setActiveTab({ tab }));
  }

  togglePanel(): void {
    this.store$.dispatch(WebSocketDebugActions.togglePanel());
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.ctrlKey && event.shiftKey && event.key === 'X') {
      event.preventDefault();
      this.togglePanel();
    }
  }

  onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = this.panelWidth;

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      const diff = startX - moveEvent.clientX;
      this.panelWidth = Math.max(450, Math.min(900, startWidth + diff));
      document.documentElement.style.setProperty('--debug-panel-width', `${this.panelWidth}px`);

      // Update admin layout margin if panel is open
      if (this.isPanelOpen) {
        this.updateAdminLayoutMargin(true);
      }
    };

    const handleMouseUp = (): void => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
}
