import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { ProductType } from 'app/enums/product-type.enum';
import { helptextAbout } from 'app/helptext/about';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { CopyrightLineComponent } from 'app/modules/layout/components/copyright-line/copyright-line.component';
import { WidgetHelpComponent } from 'app/pages/dashboard/widgets/help/widget-help/widget-help.component';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('WidgetHelpComponent', () => {
  let spectator: Spectator<WidgetHelpComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: WidgetHelpComponent,
    declarations: [
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

  it('renders widget title', () => {
    expect(spectator.query('.header')).toHaveText('TrueNAS Help');
  });

  it('renders help sections', async () => {
    const icons = await loader.getAllHarnesses(IxIconHarness);
    const [firstIcon, secondIcon, thirdIcon] = await parallel(() => icons.map((icon) => icon.getName()));
    const [firstLine, secondLine, thirdLine] = spectator.queryAll('.helptext');

    expect(firstIcon).toBe('assignment');
    expect(firstLine.innerHTML).toBe(helptextAbout.docs);

    expect(secondIcon).toBe('group');
    expect(secondLine.innerHTML).toBe(helptextAbout.forums);

    expect(thirdIcon).toBe('mail');
    expect(thirdLine.innerHTML).toBe(helptextAbout.newsletter);
  });

  it('renders copyright', () => {
    expect(spectator.query(CopyrightLineComponent)).toExist();
  });
});
