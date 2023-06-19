import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptext = {
  two_factor: {
    title: T('User Settings'),
    message: T('Use this form to set up Two-Factor Authentication for this system. \
 Then link the system to an authenticator app (such as Google Authenticator, LastPass Authenticator, etc.) \
 on a mobile device.'),
    otp: {
      placeholder: T('One-Time Password (OTP) Digits'),
      tooltip: T('The number of digits in the One-Time Password. The default value is 6, \
 which is the length of the standard OTP from Google. Check the settings of your app or device \
 before selecting this.'),
      validation: [Validators.min(6), Validators.max(8)],
    },
    interval: {
      placeholder: T('Interval'),
      tooltip: T('The lifespan (in seconds) of each One-Time Password. Default is 30 seconds. \
 The minimum lifetime is 5 seconds.'),
      validation: [Validators.min(5), Validators.pattern(/^\d+$/)],
      hint: T('Some authentication tools default to 30 seconds and do not support custom intervals.'),
    },
    window: {
      placeholder: T('Window'),
      tooltip: T('Use <i>Window</i> to extend the validity of passwords beyond the <i>Interval</i> setting. \
For example, a window setting of 1 means that one password before and after the current one is valid. \
leaving three valid passwords. Extending the window can be useful in high-latency situations. \
IMPORTANT: Two-factor authentication is time-based and requires that the system time is set correctly.'),
      validation: [Validators.min(0)],
    },
    services: {
      placeholder: T('Enable Two-Factor Auth for SSH'),
      tooltip: T('Enable two-factor authentication for SSH access to the system. It is recommended \
 to leave this DISABLED until after two-factor authentication is successfully tested with the UI.'),
    },

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

    sys: T('System-Generated Settings'),

    submitDialog: {
      title: T('Important'),
      message: T('These settings require the reconfiguration of any existing client. \
 After saving these changes, use your device to scan the QR Code.'),
      btn: T('Save'),
    },

    global_enabled_user_enabled: T('Two-Factor authentication has been configured. No further actions are required.'),
    global_enabled_user_disabled: T('Two-Factor authentication is required on this system, but it\'s not yet configured for your user. Please configure it now.'),
    global_disabled: T('Two-Factor authentication is not enabled on this this system. You can configure your personal settings, but they will have no effect until two-factor authentication is enabled globally by system administrator.'),

    enable_button: T('Enable Two-Factor Authentication'),
    disable_button: T('Disable Two-Factor Authentication'),
    confirm_dialog: {
      title: T('Enable Two-Factor Authentication'),
      message: T('CAUTION: Once Two-Factor Authentication is enabled, a One-Time Password (OTP) \
 will be required to sign into this system. Be sure to immediately set up another two-factor device.'),
      btn: T('Confirm'),
    },
    error: T('Error'),

    renewSecret: {
      title: T('Renew Secret'),
      message: T('Renewing the secret will cause a new URI and a \
    new QR code to be generated, making it necessary to update your two-factor device or app.'),
      btn: T('Renew'),
    },

    formTitle: T('Two-Factor Authentication'),
  },
};
