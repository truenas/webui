import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { CoreComponents } from 'app/core/core-components.module';
import { ProductType } from 'app/enums/product-type.enum';
import { CopyrightLineComponent } from 'app/modules/common/copyright-line/copyright-line.component';
import { SystemGeneralService } from 'app/services';

describe('CopyrightLineComponent', () => {
  let spectator: Spectator<CopyrightLineComponent>;
  const createComponent = createComponentFactory({
    component: CopyrightLineComponent,
    imports: [
      CoreComponents,
    ],
    providers: [
      mockProvider(SystemGeneralService, {
        getProductType: jest.fn(() => ProductType.Scale),
        getCopyrightYear$: of(2022),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows copyright line with product type and year of build', () => {
    expect(spectator.fixture.nativeElement).toHaveText('TrueNAS SCALE ® © 2022');
    expect(spectator.fixture.nativeElement).toHaveText('iXsystems, Inc');
  });
});
