import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertCategory } from 'app/interfaces/alert.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { AlertClassesTabComponent } from './alert-classes-tab.component';

describe('AlertClassesTabComponent', () => {
  let spectator: Spectator<AlertClassesTabComponent>;
  let isAuthenticated$: BehaviorSubject<boolean>;

  const mockCategories: AlertCategory[] = [
    {
      id: 'APPLICATIONS',
      title: 'Applications',
      classes: [
        { id: AlertClassName.AppUpdate, title: 'Application Update Available', level: 'INFO' },
      ],
    },
    {
      id: 'SYSTEM',
      title: 'System',
      classes: [
        { id: 'BrandNewBackendAlert' as AlertClassName, title: 'Brand New Alert', level: 'WARNING' },
      ],
    },
  ] as AlertCategory[];

  const createComponent = createComponentFactory({
    component: AlertClassesTabComponent,
    providers: [
      mockProvider(ApiService, {
        call: jest.fn(() => of(mockCategories)),
      }),
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    isAuthenticated$ = new BehaviorSubject<boolean>(false);
    spectator = createComponent({
      providers: [
        mockProvider(WebSocketStatusService, {
          isAuthenticated$,
        }),
      ],
    });
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should not call API before authentication', () => {
    spectator.detectChanges();

    expect(spectator.inject(ApiService).call).not.toHaveBeenCalled();
    expect(spectator.component.isAuthenticated()).toBe(false);
  });

  it('should auto-check once authenticated', () => {
    spectator.detectChanges();
    isAuthenticated$.next(true);
    spectator.detectChanges();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('alert.list_categories');
    expect(spectator.component.lastCheckedFormatted()).toBeTruthy();
  });

  it('should identify classes missing from enum', () => {
    spectator.detectChanges();
    isAuthenticated$.next(true);
    spectator.detectChanges();

    const missing = spectator.component.missingFromEnum();
    expect(missing).toContainEqual({
      id: 'BrandNewBackendAlert',
      title: 'Brand New Alert',
      category: 'System',
    });
  });

  it('should identify classes in enum but missing enhancement registry entry', () => {
    spectator.detectChanges();
    isAuthenticated$.next(true);
    spectator.detectChanges();

    const missingEnh = spectator.component.missingEnhancement();
    const appUpdateInMissing = missingEnh.some((item) => item.id === (AlertClassName.AppUpdate as string));
    // AppUpdate IS in the registry (byClass), so it should NOT be in missingEnhancement
    expect(appUpdateInMissing).toBe(false);
  });

  it('should identify stale classes in UI', () => {
    spectator.detectChanges();
    isAuthenticated$.next(true);
    spectator.detectChanges();

    const stale = spectator.component.staleInUi();
    expect(stale.length).toBeGreaterThan(0);
    expect(stale).not.toContain(AlertClassName.AppUpdate);
  });

  it('should display error message in UI when API fails', () => {
    const api = spectator.inject(ApiService);
    (api.call as jest.Mock).mockReturnValue(throwError(() => new Error('Connection failed')));

    spectator.detectChanges();
    isAuthenticated$.next(true);
    spectator.detectChanges();

    expect(spectator.component.error()).toContain('Connection failed');
    expect(spectator.component.loading()).toBe(false);
    expect(spectator.query('.error-message')).toContainText('Connection failed');
  });

  it('should not auto-check when autoCheck is disabled', () => {
    spectator.component.autoCheck.set(false);
    spectator.detectChanges();
    isAuthenticated$.next(true);
    spectator.detectChanges();

    expect(spectator.inject(ApiService).call).not.toHaveBeenCalled();
  });

  it('should run comparison when Check Now is clicked', () => {
    spectator.component.autoCheck.set(false);
    spectator.detectChanges();

    spectator.component.runComparison();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('alert.list_categories');
  });
});
