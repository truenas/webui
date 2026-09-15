import { s3UserFormPreset } from 'app/pages/sharing/s3/utils/s3-user-picker.utils';

describe('s3UserFormPreset', () => {
  it('starts a new account without SMB access and without a password', () => {
    expect(s3UserFormPreset.values).toEqual({ smb: false, password_disabled: true });
  });

  it('locks nothing, so both stay the admin\'s to change', () => {
    // Deliberate: an S3 account is the common case from these pickers, not the
    // only allowed one. An admin who wants the same person to have SMB access
    // ticks it, and the form turns the password back on for them.
    expect(s3UserFormPreset.locked).toBeUndefined();
  });
});
