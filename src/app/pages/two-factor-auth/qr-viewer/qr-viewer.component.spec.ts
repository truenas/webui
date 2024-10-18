import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { QrCodeComponent } from 'ng-qrcode';
import { helptext2fa } from 'app/helptext/system/2fa';
import { IxWarningComponent } from 'app/modules/forms/ix-forms/components/ix-warning/ix-warning.component';
import { QrViewerComponent } from 'app/pages/two-factor-auth/qr-viewer/qr-viewer.component';

describe('QrViewerComponent', () => {
  let spectator: Spectator<QrViewerComponent>;

  const createComponent = createComponentFactory({
    component: QrViewerComponent,
    declarations: [
      MockComponent(IxWarningComponent),
      MockComponent(QrCodeComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        qrInfo: '12345',
      },
    });
  });

  it('shows warning message when parent component requires it', () => {
    spectator.setInput('showWarning', true);
    const warning = spectator.query(IxWarningComponent);
    expect(warning).toBeTruthy();
    expect(warning).toHaveAttribute('message', helptext2fa.two_factor.qrCodeMessage);
  });

  it('shows qr code', () => {
    const qrCode = spectator.query(QrCodeComponent);
    expect(qrCode).toBeTruthy();
    expect(qrCode.size).toBe(200);
  });
});
