import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptext2fa = {
  two_factor: {
    secret: {
      placeholder: T('Secret (Read only)'),
      tooltip: T('The secret used to generate OTPs. The secret is produced by the system when Two-Factor \
 Authentication is first activated.'),
    },

    uri: {
      placeholder: T('Provisioning URI (includes Secret - Read only):'),
      tooltip: T('The URI used to provision an OTP. The URI (which contains the secret) is encoded in a QR Code. \
 To set up an OTP app like Google Authenticator, use the app to scan the QR code or enter the secret manually \
 into the app. The URI is produced by the system when Two-Factor Authentication is first activated.'),
    },

    global_enabled_user_enabled: T('Two-Factor authentication has been configured.'),
    global_enabled_user_disabled: T('Two-Factor authentication is required on this system, but it\'s not yet configured for your user. Please configure it now.'),
    global_disabled: T('Two-Factor authentication is not enabled on this this system. You can configure your personal settings, but they will have no effect until two-factor authentication is enabled globally by system administrator.'),
    qrCodeMessage: T('Scan this QR Code with your authenticator app of choice. The next time you try to login, you will be asked to enter an One Time Password (OTP) from your authenticator app. This step is extremely important. Without the OTP you will be locked out of this system.'),

    error: T('Error'),

    renewSecret: {
      title: T('Renew Secret'),
      message: T('Renewing the secret will cause a new URI and a \
    new QR code to be generated, making it necessary to update your two-factor device or app.'),
      btn: T('Renew'),
    },

    card: {
      toleranceWindowTooltip: T('Extends the validity of OTP by that many windows of intervals before and after the current interval'),
    },
  },
};
