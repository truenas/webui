import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { ProductType } from 'app/enums/product-type.enum';
import { CopyrightLineComponent } from 'app/modules/layout/components/copyright-line/copyright-line.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('CopyrightLineComponent', () => {
  let spectator: Spectator<CopyrightLineComponent>;
  const createComponent = createComponentFactory({
    component: CopyrightLineComponent,
    imports: [
      MapValuePipe,
    ],
    providers: [
      mockProvider(SystemGeneralService, {
        getProductType$: of(ProductType.Scale),
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
