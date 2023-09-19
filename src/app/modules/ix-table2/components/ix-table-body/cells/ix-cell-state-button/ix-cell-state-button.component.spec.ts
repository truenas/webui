import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { ShowLogsDialogComponent } from 'app/modules/common/dialog/show-logs-dialog/show-logs-dialog.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxCellStateButtonComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';

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
    imports: [IxTable2Module],
    providers: [
      mockProvider(MatDialog, {
        open: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        propertyName: 'state',
        row: {
          state: JobState.Success,
          job: { id: 123456 },
          warnings: [{}, {}],
        } as TestTableData,
        getJob: (row) => row.job,
      } as Partial<IxCellStateButtonComponent<TestTableData>>,
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows status text', async () => {
    const button = await loader.getHarness(MatButtonHarness);
    expect(await button.getText()).toBe(JobState.Success);
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
    spectator.setInput('getWarnings', (row) => row.warnings);
    const button = await loader.getHarness(MatButtonHarness);
    expect(await (await button.host()).hasClass('fn-theme-orange')).toBeTruthy();
  });

  it('sets icon when there are warnings', async () => {
    spectator.setInput('getWarnings', (row) => row.warnings);
    const button = await loader.getHarness(MatButtonHarness);
    expect(await button.hasHarness(IxIconHarness.with({ name: 'mdi-alert' }))).toBeTruthy();
  });
});
