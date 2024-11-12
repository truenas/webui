import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { AppState } from 'app/store';
import { selectBuildYear, selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

describe('CopyrightLineComponent', () => {
  let spectator: Spectator<CopyrightLineComponent>;
  let store$: MockStore<AppState>;

  const createComponent = createComponentFactory({
    component: CopyrightLineComponent,
    imports: [MapValuePipe],
    providers: [
      provideMockStore({
        selectors: [{
          selector: selectIsEnterprise,
          value: false,
        }, {
          selector: selectBuildYear,
          value: 2024,
        }],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    store$ = spectator.inject(MockStore);
  });

  it('shows copyright line with product type and year of build', () => {
    store$.overrideSelector(selectIsEnterprise, false);
    store$.refreshState();
    spectator.detectChanges();

    expect(spectator.fixture.nativeElement).toHaveText('TrueNAS ® © 2024');
    expect(spectator.fixture.nativeElement).toHaveText('iXsystems, Inc');
  });

  it('shows copyright line with enterprise product type and year of build', () => {
    store$.overrideSelector(selectIsEnterprise, true);
    store$.refreshState();
    spectator.detectChanges();

    expect(spectator.fixture.nativeElement).toHaveText('TrueNAS ENTERPRISE ® © 2024');
    expect(spectator.fixture.nativeElement).toHaveText('iXsystems, Inc');
  });
});
