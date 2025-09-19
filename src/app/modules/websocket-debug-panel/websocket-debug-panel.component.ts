import { AsyncPipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, HostListener, OnDestroy, Renderer2, ChangeDetectorRef, NgZone, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { EnclosureMockService } from 'app/services/enclosure-mock.service';
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
  // Ensure the service is instantiated
  enclosureMockService = inject(EnclosureMockService);

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

  ngOnInit(): void {
    // Load saved mock configs and restore panel state
    this.store$.dispatch(WebSocketDebugActions.loadMockConfigs());
    this.store$.dispatch(WebSocketDebugActions.loadEnclosureMockConfig());

    // Ensure EnclosureMockService starts listening after configs are loaded
    // The service is injected in constructor, so it's already created

    // Restore panel state from localStorage asynchronously
    this.ngZone.runOutsideAngular(() => {
      Promise.resolve().then(() => {
        const isOpen = safeGetItem<boolean>(storageKeys.PANEL_OPEN, false);
        if (isOpen) {
          this.ngZone.run(() => {
            this.store$.dispatch(WebSocketDebugActions.setPanelOpen({ isOpen }));
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
      } else if (isOpen && retryCount < 10) {
        // If admin layout is not found yet and panel should be open, try again
        // Use requestAnimationFrame for better performance
        requestAnimationFrame(() => {
          this.ngZone.run(() => {
            this.updateAdminLayoutMargin(isOpen, retryCount + 1);
          });
        });
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
