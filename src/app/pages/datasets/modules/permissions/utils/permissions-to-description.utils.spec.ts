import { fakeTranslateService } from 'app/core/testing/classes/fake-translate.service';
import { PosixPermission } from 'app/enums/posix-acl.enum';
import { PosixPermissions } from 'app/interfaces/acl.interface';
import {
  posixPermissionsToDescription,
} from 'app/pages/datasets/modules/permissions/utils/permissions-to-description.utils';

describe('posixPermissionsToDescription', () => {
  it('returns a translated "None" when all permissions are off', () => {
    const permissions = {
      [PosixPermission.Write]: false,
      [PosixPermission.Read]: false,
      [PosixPermission.Execute]: false,
    } as PosixPermissions;

    const description = posixPermissionsToDescription(fakeTranslateService, permissions);

    expect(description).toBe('None');
    expect(fakeTranslateService.instant).toHaveBeenCalledWith('None');
  });

  it('returns translated permission names joined with |', () => {
    const permissions = {
      [PosixPermission.Write]: true,
      [PosixPermission.Read]: false,
      [PosixPermission.Execute]: true,
    } as PosixPermissions;

    const description = posixPermissionsToDescription(fakeTranslateService, permissions);

    expect(description).toBe('Write | Execute');
    expect(fakeTranslateService.instant).toHaveBeenCalledWith('Write');
    expect(fakeTranslateService.instant).toHaveBeenCalledWith('Execute');
  });
});
