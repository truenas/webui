import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { ProductType } from 'app/enums/product-type.enum';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { CopyrightLineComponent } from 'app/modules/layout/components/copyright-line/copyright-line.component';
import { DragHandleComponent } from 'app/pages/dashboard-old/components/drag-handle/drag-handle.component';
import { WidgetHelpComponent } from 'app/pages/dashboard-old/components/widget-help/widget-help.component';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('WidgetHelpComponent', () => {
  let spectator: Spectator<WidgetHelpComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: WidgetHelpComponent,
    declarations: [
      MockComponent(DragHandleComponent),
      MockComponent(CopyrightLineComponent),
    ],
    providers: [
      mockProvider(SystemGeneralService, {
        isEnterprise: () => true,
        getProductType$: of(ProductType.Scale),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks widget title', () => {
    expect(spectator.query('.card-title-text')).toHaveText('TrueNAS Help');
  });

  it('checks icons order', async () => {
    const icons = await loader.getAllHarnesses(IxIconHarness);
    const [backButton, firstIcon, secondIcon, thirdIcon] = await parallel(() => icons.map((icon) => icon.getName()));
    expect(backButton).toBe('chevron_left');
    expect(firstIcon).toBe('assignment');
    expect(secondIcon).toBe('group');
    expect(thirdIcon).toBe('mail');
  });

  it('checks helptext', () => {
    const [firstLine, secondLine, thirdLine] = spectator.queryAll('.helptext');
    expect(firstLine).toHaveText('The TrueNAS Documentation Site is a collaborative website with helpful guides and information about your new storage system.');
    expect(secondLine).toHaveText('The TrueNAS Community Forums are the best place to ask questions and interact with fellow TrueNAS users.');
    expect(thirdLine).toHaveText('You can join the TrueNAS Newsletter for monthly updates and latest developments.');
  });

  it('checks back button', async () => {
    jest.spyOn(spectator.component, 'goBack');

    const backButton = await loader.getHarness(IxIconHarness.with({ name: 'chevron_left' }));
    await backButton.click();

    expect(spectator.component.goBack).toHaveBeenCalled();
  });
});
