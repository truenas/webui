import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertCategory } from 'app/interfaces/alert.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { AlertClassesTabComponent } from './alert-classes-tab.component';

describe('AlertClassesTabComponent', () => {
  let spectator: Spectator<AlertClassesTabComponent>;
  let loader: HarnessLoader;
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
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should show waiting message before authentication', () => {
    spectator.detectChanges();

    expect(spectator.inject(ApiService).call).not.toHaveBeenCalled();
    expect(spectator.query('.not-authenticated')).toExist();
  });

  it('should auto-check once authenticated and show last checked time', () => {
    spectator.detectChanges();
    isAuthenticated$.next(true);
    spectator.detectChanges();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('alert.list_categories');
    expect(spectator.query('.last-checked')).toExist();
  });

  it('should show classes missing from enum in error section', () => {
    spectator.detectChanges();
    isAuthenticated$.next(true);
    spectator.detectChanges();

    const errorSection = spectator.query('.section.error');
    expect(errorSection).toExist();
    expect(errorSection).toContainText('BrandNewBackendAlert');
    expect(errorSection).toContainText('Brand New Alert');
    expect(errorSection).toContainText('System');
  });

  it('should not show AppUpdate in missing enhancement section', () => {
    spectator.detectChanges();
    isAuthenticated$.next(true);
    spectator.detectChanges();

    const warningItems = spectator.queryAll('.section.warning .class-id');
    const warningTexts = warningItems.map((el) => el.textContent.trim());
    expect(warningTexts).not.toContain(AlertClassName.AppUpdate);
  });

  it('should show stale classes section', () => {
    spectator.detectChanges();
    isAuthenticated$.next(true);
    spectator.detectChanges();

    const staleSection = spectator.query('.section.stale');
    expect(staleSection).toExist();
    expect(staleSection.textContent).not.toContain(AlertClassName.AppUpdate);
  });

  it('should display error message in UI when API fails', async () => {
    const api = spectator.inject(ApiService);
    (api.call as jest.Mock).mockReturnValue(throwError(() => new Error('Connection failed')));

    spectator.detectChanges();
    isAuthenticated$.next(true);
    spectator.detectChanges();

    expect(spectator.query('.error-message')).toContainText('Connection failed');
    const button = await loader.getHarness(TnButtonHarness);
    expect(await button.isDisabled()).toBe(false);
  });

  it('should not auto-check when autoCheck checkbox is unchecked', async () => {
    spectator.detectChanges();
    const checkbox = await loader.getHarness(TnCheckboxHarness);
    await checkbox.uncheck();

    isAuthenticated$.next(true);
    spectator.detectChanges();

    expect(spectator.inject(ApiService).call).not.toHaveBeenCalled();
  });

  it('should run comparison when Check Now button is clicked', async () => {
    spectator.detectChanges();
    const checkbox = await loader.getHarness(TnCheckboxHarness);
    await checkbox.uncheck();

    isAuthenticated$.next(true);
    spectator.detectChanges();

    const button = await loader.getHarness(TnButtonHarness);
    await button.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('alert.list_categories');
  });
});
