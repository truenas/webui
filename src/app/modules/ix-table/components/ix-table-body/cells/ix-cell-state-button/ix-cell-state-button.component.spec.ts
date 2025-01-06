import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { ShowLogsDialogComponent } from 'app/modules/dialog/components/show-logs-dialog/show-logs-dialog.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxCellStateButtonComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { selectJobs } from 'app/modules/jobs/store/job.selectors';

interface TestTableData {
  state: JobState;
  job: Job;
  warnings: unknown[];
}

describe('IxCellStateButtonComponent', () => {
  let spectator: Spectator<IxCellStateButtonComponent<TestTableData>>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IxCellStateButtonComponent<TestTableData>,
    detectChanges: false,
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectJobs,
            value: [{
              id: 123456,
              logs_excerpt: 'completed',
              state: JobState.Success,
            } as Job],
          },
        ],
      }),
      mockProvider(MatDialog, {
        open: jest.fn(),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => {
          return {
            afterClosed: jest.fn(() => of()),
          };
        }),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.propertyName = 'state';
    spectator.component.setRow({
      state: JobState.Success,
      job: { id: 123456, logs_excerpt: 'completed', state: JobState.Success },
      warnings: [{}, {}],
    } as TestTableData);
    spectator.component.getJob = (row) => row.job;
    spectator.component.uniqueRowTag = () => '';
    spectator.component.ariaLabels = () => ['Label 1', 'Label 2'];
    spectator.component.job.set({
      id: 123456,
      logs_excerpt: 'completed',
      state: JobState.Success,
    } as Job);
    spectator.component.ngOnInit();
    spectator.detectChanges();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows status text', async () => {
    const button = await loader.getHarness(MatButtonHarness);
    expect(await button.getText()).toBe(JobState.Success);
    expect(await (await button.host()).hasClass('fn-theme-green')).toBeTruthy();
  });

  it('sets class', async () => {
    const button = await loader.getHarness(MatButtonHarness);
    expect(await (await button.host()).hasClass('fn-theme-green')).toBeTruthy();
  });

  it('shows logs dialog', async () => {
    const button = await loader.getHarness(MatButtonHarness);
    await button.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
      ShowLogsDialogComponent,
      {
        data: expect.objectContaining({
          id: 123456,
        }),
      },
    );
  });

  it('sets class when there are warnings', async () => {
    spectator.component.getWarnings = (row) => row.warnings;
    spectator.detectComponentChanges();

    const button = await loader.getHarness(MatButtonHarness);
    expect(await (await button.host()).hasClass('fn-theme-orange')).toBeTruthy();
  });

  it('sets icon when there are warnings', async () => {
    spectator.component.getWarnings = (row) => row.warnings;
    spectator.detectComponentChanges();

    const button = await loader.getHarness(MatButtonHarness);
    expect(await button.hasHarness(IxIconHarness.with({ name: 'mdi-alert' }))).toBeTruthy();
  });

  it('gets aria label correctly', () => {
    const button = spectator.query('button')!;
    expect(button.getAttribute('aria-label')).toBe('Label 1 Label 2');
  });
});
