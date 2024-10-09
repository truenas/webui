import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { helptextApps } from 'app/helptext/apps/apps';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SelectPoolDialogComponent } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';

describe('SelectPoolDialogComponent', () => {
  let spectator: Spectator<SelectPoolDialogComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: SelectPoolDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(DockerStore, {
        setDockerPool: jest.fn(() => of({ pool: 'pool' })),
        selectedPool$: of(null),
      }),
      mockProvider(ApplicationsService, {
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
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
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

    expect(spectator.inject(DockerStore).setDockerPool).toHaveBeenCalledWith('pool2');
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });

  it('shows a warning when no pools are available and takes user to create one', () => {
    const appService = spectator.inject(ApplicationsService);
    jest.spyOn(appService, 'getPoolList').mockReturnValue(of([] as Pool[]));
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
