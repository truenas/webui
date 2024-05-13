import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { ProductImageComponent } from 'app/pages/dashboard/widgets/system/common/product-image/product-image.component';

describe('ProductImageComponent', () => {
  let spectator: Spectator<ProductImageComponent>;
  const createComponent = createComponentFactory({
    component: ProductImageComponent,
    declarations: [
      MockComponent(IxIconComponent),
    ],
    providers: [mockProvider(Router)],
  });

  it('should display "Unsupported Hardware" for Generic platform', () => {
    spectator = createComponent({
      props: {
        systemProduct: 'Standard PC (Q35 + ICH9, 2009)',
        isEnterprise: true,
        hasEnclosureSupport: false,
        isHaLicensed: false,
        isIxHardware: false,
      },
    });

    expect(spectator.query('img')).not.toHaveClass('clickable');
    expect(spectator.query('img')).toHaveAttribute('src', 'assets/images/truenas_scale_ondark_favicon.png');
    expect(spectator.query('.product-image-text')).toHaveExactText('(Unsupported Hardware)');
  });

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
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system/oldviewenclosure']);
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
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system/oldviewenclosure']);
  });
});
