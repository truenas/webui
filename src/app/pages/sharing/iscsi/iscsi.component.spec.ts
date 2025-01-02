import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTabNavBarHarness } from '@angular/material/tabs/testing';
import { Spectator } from '@ngneat/spectator';
import { createRoutingFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent, MockComponents } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { GlobalTargetConfigurationComponent } from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import { IscsiService } from 'app/services/iscsi.service';
import { IscsiComponent } from './iscsi.component';

describe('IscsiComponent', () => {
  let spectator: Spectator<IscsiComponent>;
  const hasFibreChannel$ = new BehaviorSubject(false);
  let loader: HarnessLoader;

  const createComponent = createRoutingFactory({
    component: IscsiComponent,
    declarations: [
      MockComponents(GlobalTargetConfigurationComponent),
    ],
    imports: [
      MatTabsModule,
      MockComponent(PageHeaderComponent),
    ],
    providers: [
      mockProvider(IscsiService, {
        hasFibreChannel: () => hasFibreChannel$,
      }),
      mockAuth(),
      mockApi(),
      mockProvider(SlideIn, {
        components$: [],
        open: jest.fn(() => of()),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('has a Global Target Configuration button that opens the settings form', async () => {
    const configurationButton = await loader.getHarness(MatButtonHarness.with({ text: 'Global Target Configuration' }));
    await configurationButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(GlobalTargetConfigurationComponent);
  });

  it('shows a navtab with supported links', async () => {
    const navbar = await loader.getHarness(MatTabNavBarHarness);
    const links = await navbar.getLinks();

    expect(links).toHaveLength(5);
    expect(await links[0].getLabel()).toBe('Targets');
    expect(await links[1].getLabel()).toBe('Extents');
    expect(await links[2].getLabel()).toBe('Initiators');
    expect(await links[3].getLabel()).toBe('Portals');
    expect(await links[4].getLabel()).toBe('Authorized Access');
  });

  it('shows fibre channel link navtab on a fibre channel capable system', async () => {
    hasFibreChannel$.next(true);
    spectator.detectChanges();

    const navbar = await loader.getHarness(MatTabNavBarHarness);
    const links = await navbar.getLinks();

    expect(links).toHaveLength(6);
    expect(await links[5].getLabel()).toBe('Fibre Channel Ports');
  });
});
