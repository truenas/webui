import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SpectatorRouting } from '@ngneat/spectator';
import { createRoutingFactory, mockProvider } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnIconButtonHarness, TnMenuHarness, TnMenuTesting,
} from '@truenas/ui-components';
import { LazyLoadImageDirective } from 'ng-lazyload-image';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { customAppTrain, customApp } from 'app/constants/catalog.constants';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCodeEditorComponent } from 'app/modules/forms/ix-forms/components/ix-code-editor/ix-code-editor.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { AppCardComponent } from 'app/pages/apps/components/available-apps/app-card/app-card.component';
import { CustomAppButtonComponent } from 'app/pages/apps/components/available-apps/custom-app-button/custom-app-button.component';
import { CustomAppFormComponent } from 'app/pages/apps/components/custom-app-form/custom-app-form.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('CustomAppButtonComponent', () => {
  let spectator: SpectatorRouting<CustomAppButtonComponent>;
  let loader: HarnessLoader;
  let button: TnButtonHarness;
  let formPanel: FormSidePanelService;

  const createComponent = createRoutingFactory({
    component: CustomAppButtonComponent,
    imports: [
      LazyLoadImageDirective,
      ReactiveFormsModule,
      IxCodeEditorComponent,
      MockComponent(AppCardComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(DockerStore, {
        selectedPool$: of('selected pool'),
      }),
      // Dependencies of the CustomAppForm rendered inside the side panel.
      mockApi([
        mockJob('app.create'),
        mockJob('app.update'),
      ]),
      mockProvider(ApplicationsService, {
        getAllApps: jest.fn(() => of([])),
        getApp: jest.fn(() => of([])),
      }),
      mockProvider(ErrorHandlerService),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: jest.fn(() => of(true)),
        })),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.cancel()),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    formPanel = spectator.inject(FormSidePanelService);
    button = await loader.getHarness(TnButtonHarness.with({ label: 'Custom App' }));
  });

  it('renders Custom App Button', () => {
    expect(button).toExist();
  });

  it('navigates to create custom app page', async () => {
    await button.click();

    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();

    expect(router.navigate).toHaveBeenCalledWith([
      '/apps', 'available', customAppTrain, customApp, 'install',
    ]);
  });

  it('disables Custom App button if pool is not set', () => {
    const store = spectator.inject(DockerStore);
    Object.defineProperty(store, 'selectedPool$', { value: of(undefined) });
    spectator.detectChanges();

    expect(button.isDisabled()).toBeTruthy();
  });

  it('opens the Custom App YAML form in a side panel when "Install via YAML" is clicked', async () => {
    const menuTrigger = await loader.getHarness(TnIconButtonHarness.with({ name: 'dots-vertical' }));
    await menuTrigger.click();
    const menu = await TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);

    await menu.clickItem({ label: /Install via YAML$/ });
    spectator.detectChanges();

    expect(formPanel.open).toHaveBeenCalledWith(CustomAppFormComponent, {
      title: 'Install via YAML',
      wide: true,
      testId: 'custom-app',
    });
  });
});
