import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { ProductType } from 'app/enums/product-type.enum';
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
        {
          id: AlertClassName.AppUpdate,
          title: 'Application Update Available',
          level: 'INFO',
          product_types: [ProductType.CommunityEdition, ProductType.Enterprise],
        },
      ],
    },
    {
      id: 'SYSTEM',
      title: 'System',
      classes: [
        {
          id: 'BrandNewBackendAlert' as AlertClassName,
          title: 'Brand New Alert',
          level: 'WARNING',
          product_types: [ProductType.CommunityEdition, ProductType.Enterprise],
        },
      ],
    },
  ] as AlertCategory[];

  const defaultProductType = ProductType.CommunityEdition;

  function setupApiMock(api: ApiService, categories = mockCategories, productType = defaultProductType): void {
    (api.call as jest.Mock).mockImplementation((method: string) => {
      if (method === 'alert.list_categories') return of(categories);
      if (method === 'system.product_type') return of(productType);
      return of(null);
    });
  }

  const createComponent = createComponentFactory({
    component: AlertClassesTabComponent,
    providers: [
      mockProvider(ApiService),
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
    setupApiMock(spectator.inject(ApiService));
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
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('system.product_type');
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

  it('should not show enterprise-only classes as stale on community edition', () => {
    spectator.detectChanges();
    isAuthenticated$.next(true);
    spectator.detectChanges();

    const staleSection = spectator.query('.section.stale');
    expect(staleSection.textContent).not.toContain(AlertClassName.NoCriticalFailoverInterfaceFound);
    expect(staleSection.textContent).not.toContain(AlertClassName.LicenseHasExpired);
    expect(staleSection.textContent).not.toContain(AlertClassName.UsbStorage);
  });

  it('should display error message in UI when API fails', () => {
    const api = spectator.inject(ApiService);
    (api.call as jest.Mock).mockReturnValue(throwError(() => new Error('Connection failed')));

    spectator.detectChanges();
    isAuthenticated$.next(true);
    spectator.detectChanges();

    expect(spectator.query('.error-message')).toContainText('Connection failed');
    expect(spectator.query('button[mat-button]')).not.toBeDisabled();
  });

  it('should not auto-check when autoCheck checkbox is unchecked', () => {
    spectator.detectChanges();
    const checkboxInput = spectator.query('mat-checkbox input') as HTMLInputElement;
    checkboxInput.click();
    spectator.detectChanges();

    isAuthenticated$.next(true);
    spectator.detectChanges();

    expect(spectator.inject(ApiService).call).not.toHaveBeenCalled();
  });

  it('should run comparison when Check Now button is clicked', () => {
    spectator.detectChanges();
    const checkboxInput = spectator.query('mat-checkbox input') as HTMLInputElement;
    checkboxInput.click();
    spectator.detectChanges();

    isAuthenticated$.next(true);
    spectator.detectChanges();

    spectator.click('button[mat-button]');
    spectator.detectChanges();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('alert.list_categories');
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('system.product_type');
  });
});
