import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { ProductType } from 'app/enums/product-type.enum';
import { helptextAbout } from 'app/helptext/about';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { CopyrightLineComponent } from 'app/modules/layout/components/copyright-line/copyright-line.component';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
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
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('renders widget title', () => {
    expect(spectator.query('.header')).toHaveText('TrueNAS Help');
  });

  it('renders help sections', async () => {
    const icons = await loader.getAllHarnesses(IxIconHarness);
    const [firstIcon, secondIcon, thirdIcon] = await parallel(() => icons.map((icon) => icon.getName()));
    const [firstLine, secondLine, thirdLine] = spectator.queryAll('.helptext');
    const [firstHrefIconLine, secondHrefIconLine, thirdHrefIconLine] = spectator.queryAll('.icon-wrapper');

    expect(spectator.query('.icon-wrapper a ix-icon')).toExist();

    expect(firstIcon).toBe('assignment');
    expect(firstLine.innerHTML).toBe(helptextAbout.docs);
    expect(firstHrefIconLine.textContent).toBe('Docs');

    expect(secondIcon).toBe('group');
    expect(secondLine.innerHTML).toBe(helptextAbout.forums);
    expect(secondHrefIconLine.textContent).toBe('Forums');

    expect(thirdIcon).toBe('mail');
    expect(thirdLine.innerHTML).toBe(helptextAbout.newsletter);
    expect(thirdHrefIconLine.textContent).toBe('Newsletter');
  });

  it('renders copyright', () => {
    expect(spectator.query(CopyrightLineComponent)).toExist();
  });
});
