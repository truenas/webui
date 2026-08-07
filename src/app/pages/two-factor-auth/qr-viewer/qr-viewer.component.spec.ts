import 'jest-canvas-mock';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { TnBannerHarness } from '@truenas/ui-components';
import { MockModule } from 'ng-mocks';
import { QrCodeComponent, QrCodeDirective, QrCodeModule } from 'ng-qrcode';
import { helptext2fa } from 'app/helptext/system/2fa';
import { QrViewerComponent } from 'app/pages/two-factor-auth/qr-viewer/qr-viewer.component';

describe('QrViewerComponent', () => {
  let spectator: Spectator<QrViewerComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: QrViewerComponent,
    imports: [
      QrCodeComponent,
      QrCodeDirective,
      MockModule(QrCodeModule),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        qrInfo: '12345',
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows warning message when parent component requires it', async () => {
    spectator.setInput('showWarning', true);

    const banner = await loader.getHarness(TnBannerHarness);
    expect(await banner.getText()).toContain(helptext2fa.qrCodeMessage);
  });

  it('shows qr code', () => {
    const qrCode = spectator.query(QrCodeComponent)!;
    expect(qrCode).toBeTruthy();
    expect(qrCode.size).toBe(200);
  });
});
