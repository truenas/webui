import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { ProductImageComponent } from 'app/pages/dashboard/widgets/system/common/product-image/product-image.component';

describe('ProductImageComponent', () => {
  let spectator: Spectator<ProductImageComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ProductImageComponent,
    providers: [mockProvider(Router)],
  });

  describe('Generic', () => {
    it('should display "Unsupported Hardware" for Generic platform', async () => {
      spectator = createComponent({
        props: {
          systemProduct: 'Standard PC (Q35 + ICH9, 2009)',
          isEnterprise: true,
          hasEnclosureSupport: false,
          isHaLicensed: false,
          isIxHardware: false,
        },
      });

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      const icon = await loader.getHarness(IxIconHarness);

      expect(spectator.query('img')).not.toExist();
      expect(await icon.getName()).toBe('ix-truenas-logo-mark');
      expect(spectator.query('.product-image-text')).toHaveExactText('(Unsupported Hardware)');
    });
  });

  describe('iX Hardware', () => {
    it('should display image for M40 platform', () => {
      spectator = createComponent({
        props: {
          systemProduct: 'TRUENAS-M40-HA',
          isEnterprise: true,
          hasEnclosureSupport: true,
          isHaLicensed: true,
          isIxHardware: true,
        },
      });

      const image = spectator.query('img');

      expect(image).toHaveId('M40');
      expect(image).toHaveAttribute('src', 'assets/images/servers/M40.png');

      expect(spectator.query('.product-image-text')).not.toHaveExactText('(Unsupported Hardware)');

      expect(image).toHaveClass('clickable');
      spectator.click('img');
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system/viewenclosure']);
    });

    it('should display image for F60 platform', () => {
      spectator = createComponent({
        props: {
          systemProduct: 'TRUENAS-F60-HA',
          isEnterprise: true,
          hasEnclosureSupport: true,
          isHaLicensed: true,
          isIxHardware: true,
        },
      });

      const image = spectator.query('img');

      expect(image).toHaveId('F60');
      expect(image).toHaveAttribute('src', 'assets/images/servers/F60.png');

      expect(spectator.query('.product-image-text')).not.toHaveExactText('(Unsupported Hardware)');

      expect(image).toHaveClass('clickable');
      spectator.click('img');
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system/viewenclosure']);
    });
  });
});
