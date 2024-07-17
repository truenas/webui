import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { ProductType } from 'app/enums/product-type.enum';
import { CopyrightLineComponent } from 'app/modules/layout/components/copyright-line/copyright-line.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { selectBuildTime, selectProductType } from 'app/store/system-info/system-info.selectors';

describe('CopyrightLineComponent', () => {
  let spectator: Spectator<CopyrightLineComponent>;
  const createComponent = createComponentFactory({
    component: CopyrightLineComponent,
    imports: [
      MapValuePipe,
    ],
    providers: [
      provideMockStore({
        selectors: [{
          selector: selectBuildTime,
          value: 2022,
        }, {
          selector: selectProductType,
          value: ProductType.Scale,
        }],
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
