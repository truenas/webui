import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxCellActionsComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';

interface TestTableData {
  id: number;
  name: string;
}

describe('IxCellActionsComponent', () => {
  let spectator: Spectator<IxCellActionsComponent<TestTableData>>;
  let loader: HarnessLoader;

  const testRow: TestTableData = { id: 1, name: 'Test Row' };

  const createComponent = createComponentFactory({
    component: IxCellActionsComponent<TestTableData>,
    detectChanges: false,
    providers: [
      mockProvider(AuthService, {
        hasRole: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.setRow(testRow);
    spectator.component.uniqueRowTag = (row) => `row-${row.id}`;
    spectator.component.ariaLabels = (row) => [row.name];

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('renders action buttons', async () => {
    const mockAction: IconActionConfig<TestTableData> = {
      iconName: iconMarker('mdi-pencil'),
      tooltip: 'Edit',
      onClick: jest.fn(),
    };

    spectator.component.actions = [mockAction];
    spectator.detectChanges();

    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons).toHaveLength(1);

    const icon = await loader.getHarness(IxIconHarness);
    expect(await icon.getName()).toBe('mdi-pencil');
  });

  it('renders multiple action buttons', async () => {
    const actions: IconActionConfig<TestTableData>[] = [
      { iconName: iconMarker('mdi-pencil'), tooltip: 'Edit', onClick: jest.fn() },
      { iconName: iconMarker('mdi-delete'), tooltip: 'Delete', onClick: jest.fn() },
    ];

    spectator.component.actions = actions;
    spectator.detectChanges();

    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons).toHaveLength(2);
  });

  it('calls onClick handler when button is clicked', async () => {
    const onClickSpy = jest.fn();
    const mockAction: IconActionConfig<TestTableData> = {
      iconName: iconMarker('mdi-pencil'),
      tooltip: 'Edit',
      onClick: onClickSpy,
    };

    spectator.component.actions = [mockAction];
    spectator.detectChanges();

    const button = await loader.getHarness(MatButtonHarness);
    await button.click();

    expect(onClickSpy).toHaveBeenCalledWith(testRow);
  });

  it('disables button when disabled function returns true', async () => {
    const mockAction: IconActionConfig<TestTableData> = {
      iconName: iconMarker('mdi-pencil'),
      tooltip: 'Edit',
      onClick: jest.fn(),
      disabled: () => of(true),
    };

    spectator.component.actions = [mockAction];
    spectator.detectChanges();

    const button = await loader.getHarness(MatButtonHarness);
    expect(await button.isDisabled()).toBe(true);
  });

  it('enables button when disabled function returns false', async () => {
    const mockAction: IconActionConfig<TestTableData> = {
      iconName: iconMarker('mdi-pencil'),
      tooltip: 'Edit',
      onClick: jest.fn(),
      disabled: () => of(false),
    };

    spectator.component.actions = [mockAction];
    spectator.detectChanges();

    const button = await loader.getHarness(MatButtonHarness);
    expect(await button.isDisabled()).toBe(false);
  });

  it('hides button when hidden function returns true', async () => {
    const mockAction: IconActionConfig<TestTableData> = {
      iconName: iconMarker('mdi-pencil'),
      tooltip: 'Edit',
      onClick: jest.fn(),
      hidden: () => of(true),
    };

    spectator.component.actions = [mockAction];
    spectator.detectChanges();

    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons).toHaveLength(0);
  });

  it('shows button when hidden function returns false', async () => {
    const mockAction: IconActionConfig<TestTableData> = {
      iconName: iconMarker('mdi-pencil'),
      tooltip: 'Edit',
      onClick: jest.fn(),
      hidden: () => of(false),
    };

    spectator.component.actions = [mockAction];
    spectator.detectChanges();

    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons).toHaveLength(1);
  });
});
