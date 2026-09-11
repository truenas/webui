import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { environment } from 'environments/environment';
import { ProductType } from 'app/enums/product-type.enum';
import { License, SystemInfo } from 'app/interfaces/system-info.interface';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { AppState } from 'app/store';
import {
  selectLicenseLoadFailed, selectProductType, selectSystemInfo,
} from 'app/store/system-info/system-info.selectors';

describe('CopyrightLineComponent', () => {
  let spectator: Spectator<CopyrightLineComponent>;
  let store$: MockStore<AppState>;

  const buildYear = environment.buildYear;

  const createComponent = createComponentFactory({
    component: CopyrightLineComponent,
    imports: [MapValuePipe],
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectProductType, value: null },
          { selector: selectSystemInfo, value: { license: null } as SystemInfo },
          { selector: selectLicenseLoadFailed, value: false },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    store$ = spectator.inject(MockStore);
  });

  it('shows copyright line with unknown product type and year of build', () => {
    store$.overrideSelector(selectProductType, null);
    store$.refreshState();
    spectator.detectChanges();

    expect(spectator.fixture.nativeElement).toHaveText(`TrueNAS®  © ${buildYear} iXsystems, Inc. dba  TrueNAS`);
    expect(spectator.fixture.nativeElement).toHaveText('iXsystems, Inc');
    expect(spectator.query('a')).toHaveAttribute('href', 'https://truenas.com/');
  });

  it('shows copyright line with product type and year of build', () => {
    store$.overrideSelector(selectProductType, ProductType.CommunityEdition);
    store$.refreshState();
    spectator.detectChanges();

    expect(spectator.fixture.nativeElement).toHaveText(`TrueNAS® Community Edition  © ${buildYear} iXsystems, Inc. dba  TrueNAS`);
    expect(spectator.fixture.nativeElement).toHaveText('iXsystems, Inc');
    expect(spectator.query('a')).toHaveAttribute('href', 'https://truenas.com/testdrive');
  });

  it('shows copyright line with enterprise product type and year of build', () => {
    store$.overrideSelector(selectProductType, ProductType.Enterprise);
    store$.overrideSelector(selectSystemInfo, { license: { id: 'license-1' } as License } as SystemInfo);
    store$.refreshState();
    spectator.detectChanges();

    expect(spectator.fixture.nativeElement).toHaveText(`TrueNAS® Enterprise  © ${buildYear} iXsystems, Inc. dba  TrueNAS`);
    expect(spectator.fixture.nativeElement).toHaveText('iXsystems, Inc');
    expect(spectator.query('a')).toHaveAttribute('href', 'https://truenas.com/production');
  });

  it('brands an unlicensed enterprise system as Community Edition', () => {
    store$.overrideSelector(selectProductType, ProductType.Enterprise);
    store$.overrideSelector(selectSystemInfo, { license: null } as SystemInfo);
    store$.refreshState();
    spectator.detectChanges();

    expect(spectator.fixture.nativeElement).toHaveText(`TrueNAS® Community Edition  © ${buildYear} iXsystems, Inc. dba  TrueNAS`);
    expect(spectator.query('a')).toHaveAttribute('href', 'https://truenas.com/testdrive');
  });

  it('shows no edition and a neutral link while an Enterprise license is still unknown', () => {
    store$.overrideSelector(selectProductType, ProductType.Enterprise);
    store$.overrideSelector(selectSystemInfo, null);
    store$.refreshState();
    spectator.detectChanges();

    expect(spectator.fixture.nativeElement).toHaveText(`TrueNAS®  © ${buildYear} iXsystems, Inc. dba  TrueNAS`);
    expect(spectator.query('a')).toHaveAttribute('href', 'https://truenas.com/');
  });
});
