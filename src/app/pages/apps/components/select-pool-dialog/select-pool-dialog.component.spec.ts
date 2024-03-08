import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { helptextApps } from 'app/helptext/apps/apps';
import { KubernetesConfig } from 'app/interfaces/kubernetes-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SelectPoolDialogComponent } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';
import { WebSocketService } from 'app/services/ws.service';

describe('SelectPoolDialogComponent', () => {
  let spectator: Spectator<SelectPoolDialogComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: SelectPoolDialogComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(KubernetesStore, {
        updatePoolAndKubernetesConfig: jest.fn(() => of()),
        updateSelectedPool: jest.fn(() => of()),
      }),
      mockProvider(ApplicationsService, {
        getKubernetesConfig: jest.fn(() => of({})),
        getPoolList: jest.fn(() => of([
          { name: 'pool1' },
          { name: 'pool2' },
        ])),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockProvider(MatDialogRef),
      mockProvider(Router),
      mockWebSocket([
        mockJob('kubernetes.update'),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    const kubernetesStore = spectator.inject(KubernetesStore);
    jest.spyOn(kubernetesStore, 'updatePoolAndKubernetesConfig').mockReturnValue(of({}));
  });

  it('loads pools available in system and shows them in the dropdown', async () => {
    expect(spectator.inject(ApplicationsService).getPoolList).toHaveBeenCalled();

    const poolSelect = await form.getControl('Pool') as IxSelectHarness;
    expect(await poolSelect.getOptionLabels()).toEqual(['pool1', 'pool2']);
  });

  it('sets a pool for applications when form is submitted', async () => {
    await form.fillForm({
      Pool: 'pool2',
    });

    const chooseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Choose' }));
    await chooseButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith(
      'kubernetes.update',
      [{ pool: 'pool2' }],
    );
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });

  it('shows migrate checkbox when existing pool is changed to a new one', async () => {
    const appService = spectator.inject(ApplicationsService);
    jest.spyOn(appService, 'getKubernetesConfig').mockReturnValue(of({
      pool: 'pool1',
    } as KubernetesConfig));
    spectator.component.ngOnInit();

    await form.fillForm({
      Pool: 'pool2',
    });

    const migrateCheckbox = await form.getControl('Migrate applications to the new pool');
    expect(migrateCheckbox).toBeTruthy();
  });

  it('sets new pool and migrates applications when form is submitted', async () => {
    await form.fillForm(
      {
        Pool: 'pool2',
        'Migrate applications to the new pool': true,
      },
    );

    const chooseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Choose' }));
    await chooseButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith(
      'kubernetes.update',
      [{ migrate_applications: true, pool: 'pool2' }],
    );
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });

  it('shows a warning when no pools are available and takes user to create one', () => {
    const appService = spectator.inject(ApplicationsService);
    jest.spyOn(appService, 'getPoolList').mockReturnValue(of([]));
    spectator.component.ngOnInit();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: helptextApps.noPool.title,
      message: helptextApps.noPool.message,
      hideCheckbox: true,
      buttonText: helptextApps.noPool.action,
    });
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/storage', 'create']);
  });
});
