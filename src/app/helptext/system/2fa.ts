import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptext2fa = {
  secret: {
    label: T('Secret (Read only)'),
    tooltip: T('The secret used to generate OTPs. The secret is produced by the system when Two-Factor\
 Authentication is first activated.'),
  },

  uri: {
    label: T('Provisioning URI (includes Secret - Read only):'),
    tooltip: T('The URI used to provision an OTP. The URI (which contains the secret) is encoded in a QR Code.\
 To set up an OTP app like Google Authenticator, use the app to scan the QR code or enter the secret manually\
 into the app. The URI is produced by the system when Two-Factor Authentication is first activated.'),
  },

  allSetUp: T('Two-Factor authentication has been configured and is enabled for your current session.'),
  firstSetUp: T('Two-Factor authentication has been configured for your user,\
 but your current session was not initiated with two-factor auth.'),
  enabledGloballyButNotForUser: T('Two-Factor authentication is enabled on this system, but it\'s not yet configured for your user. Please configure it now.'),
  globallyDisabled: T('Two-Factor authentication is not enabled on this this system. You can configure your personal settings, but they will have no effect until two-factor authentication is enabled globally by system administrator.'),
  qrCodeMessage: T('Scan this QR Code with your authenticator app of choice. The next time you try to login, you will be asked to enter an One Time Password (OTP) from your authenticator app. This step is extremely important. Without the OTP you will be locked out of this system.'),

  error: T('Error'),
  loadFailed: T('The two-factor authentication settings could not be read from this system. Reload the page to try\
 again.'),

  /**
   * The middleware mints and arms a secret in one call, so the setup page can only
   * make the confirmation step feel safe by being explicit about what is already
   * true and what cancelling undoes.
   */
  verification: {
    pending: T('A 2FA secret has been generated and is already active for your account. Scan the QR code with your\
 authenticator app, then enter the code the app shows to confirm it was added correctly. If you cancel, the secret is\
 removed and two-factor authentication stays off for your account.'),
    // Renewing has already invalidated the old secret, so cancelling here turns 2FA off
    // on an account that was protected a moment ago. Say so instead of implying nothing changes.
    pendingRenewal: T('A new 2FA secret has been generated and has replaced your previous one, which no longer works.\
 Scan the QR code with your authenticator app, then enter the code the app shows to confirm it was added correctly. If\
 you cancel, two-factor authentication is turned off for your account and you will have to set it up again.'),
    // The marker is written before the call that mints the secret, so a failed renew
    // leaves the step on screen with nothing behind it. Saying a secret "is already
    // active" there would contradict the error the user just dismissed.
    pendingUnknown: T('A 2FA secret may have been generated, but it could not be read back. Generate a new one to try\
 again, or cancel to make sure no secret is left on your account.'),
    label: T('One-Time Password'),
    tooltip: T('The code your authenticator app currently shows for this account. It changes every 30 seconds.'),
    verifyBtn: T('Confirm Code'),
    cancelBtn: T('Cancel Setup'),
    invalid: T('That code does not match this secret. Check that your authenticator app was set up from the QR code\
 above and that your device clock is correct, then enter the code it shows now.'),
    unreadableSecret: T('The secret for this account could not be read, so the code cannot be checked. Generate a new\
 secret and scan it again.'),
    checkFailed: T('The code could not be checked because the current secret could not be fetched from the system.\
 Check your connection and try again.'),
    verified: T('Two-factor authentication is confirmed for your account.'),
    cancel: {
      title: T('Cancel Two-Factor Authentication Setup?'),
      message: T('The secret that was just generated will be removed and two-factor authentication will stay off for\
 your account. You can set it up again at any time.'),
      renewalMessage: T('The new secret will be removed and two-factor authentication will be turned off for your\
 account. Your previous secret was already replaced and cannot be restored, so you will have to set 2FA up again.'),
      btn: T('Remove Secret'),
      cancelBtn: T('Keep Setting Up'),
    },
  },

  renewSecret: {
    title: T('Renew Secret'),
    message: T('Renewing the secret will cause a new URI and a\
 new QR code to be generated, making it necessary to update your two-factor device or app.'),
    btn: T('Renew'),
  },

  card: {
    toleranceWindowTooltip: T('Extends the validity of OTP by that many windows of intervals before and after the current interval'),
  },
};
