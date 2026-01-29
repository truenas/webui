import { fakeAsync, tick } from '@angular/core/testing';
import { FormControl, ValidationErrors } from '@angular/forms';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { UserGroupExistenceValidationService } from 'app/modules/forms/ix-forms/validators/user-group-existence-validation.service';
import { UserService } from 'app/services/user.service';

describe('UserGroupExistenceValidationService', () => {
  let spectator: SpectatorService<UserGroupExistenceValidationService>;
  let userService: UserService;
  let translateService: TranslateService;

  const createService = createServiceFactory({
    service: UserGroupExistenceValidationService,
    providers: [
      mockProvider(UserService),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string, params?: Record<string, unknown>) => {
          if (key === 'The following groups do not exist: {groups}') {
            return `The following groups do not exist: ${String(params?.groups)}`;
          }
          if (key === 'The following users do not exist: {users}') {
            return `The following users do not exist: ${String(params?.users)}`;
          }
          if (key === 'User "{username}" does not exist') {
            return `User "${String(params?.username)}" does not exist`;
          }
          if (key === 'Group "{groupName}" does not exist') {
            return `Group "${String(params?.groupName)}" does not exist`;
          }
          return key;
        }),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    userService = spectator.inject(UserService);
    translateService = spectator.inject(TranslateService);
  });

  describe('validateGroupsExist', () => {
    it('returns null for empty group list', fakeAsync(() => {
      const control = new FormControl([]);
      const validator = spectator.service.validateGroupsExist();

      let result: ValidationErrors | null = null;
      (validator(control) as Observable<ValidationErrors | null>).subscribe((value: ValidationErrors | null) => {
        result = value;
      });

      tick(300);
      expect(result).toBeNull();
    }));

    it('returns null when all groups exist', fakeAsync(() => {
      const mockGroup1 = { id: 1, name: 'admin' } as Group;
      const mockGroup2 = { id: 2, name: 'users' } as Group;

      jest.spyOn(userService, 'getGroupByNameCached')
        .mockReturnValueOnce(of(mockGroup1))
        .mockReturnValueOnce(of(mockGroup2));

      const control = new FormControl(['admin', 'users']);
      const validator = spectator.service.validateGroupsExist();

      let result: ValidationErrors | null = null;
      (validator(control) as Observable<ValidationErrors | null>).subscribe((value: ValidationErrors | null) => {
        result = value;
      });

      tick(300);
      expect(result).toBeNull();
      expect(userService.getGroupByNameCached).toHaveBeenCalledWith('admin');
      expect(userService.getGroupByNameCached).toHaveBeenCalledWith('users');
    }));

    it('returns error when groups do not exist', fakeAsync(() => {
      jest.spyOn(userService, 'getGroupByNameCached')
        .mockReturnValue(throwError(() => new Error('Group not found')));

      const control = new FormControl(['nonexistent1', 'nonexistent2']);
      const validator = spectator.service.validateGroupsExist();

      let result: ValidationErrors | null = null;
      (validator(control) as Observable<ValidationErrors | null>).subscribe((value: ValidationErrors | null) => {
        result = value;
      });

      tick(300);
      expect(result).toEqual({
        groupsDoNotExist: {
          message: 'The following groups do not exist: nonexistent1, nonexistent2',
        },
      });
      expect(translateService.instant).toHaveBeenCalledWith(
        'The following groups do not exist: {groups}',
        { groups: 'nonexistent1, nonexistent2' },
      );
    }));

    it('debounces validation calls with default 300ms', fakeAsync(() => {
      const mockGroup = { id: 1, name: 'admin' } as Group;
      jest.spyOn(userService, 'getGroupByNameCached').mockReturnValue(of(mockGroup));

      const control = new FormControl(['admin']);
      const validator = spectator.service.validateGroupsExist();

      (validator(control) as Observable<ValidationErrors | null>).subscribe();

      tick(300);
      expect(userService.getGroupByNameCached).toHaveBeenCalledWith('admin');
      expect(userService.getGroupByNameCached).toHaveBeenCalledTimes(1);
    }));

    it('uses custom debounce time', fakeAsync(() => {
      const mockGroup = { id: 1, name: 'admin' } as Group;
      jest.spyOn(userService, 'getGroupByNameCached').mockReturnValue(of(mockGroup));

      const control = new FormControl(['admin']);
      const validator = spectator.service.validateGroupsExist(1000);

      (validator(control) as Observable<ValidationErrors | null>).subscribe();

      tick(1000);
      expect(userService.getGroupByNameCached).toHaveBeenCalledWith('admin');
    }));
  });

  describe('validateUsersExist', () => {
    it('returns null for empty user list', fakeAsync(() => {
      const control = new FormControl([]);
      const validator = spectator.service.validateUsersExist();

      let result: ValidationErrors | null = null;
      (validator(control) as Observable<ValidationErrors | null>).subscribe((value: ValidationErrors | null) => {
        result = value;
      });

      tick(300);
      expect(result).toBeNull();
    }));

    it('returns null when all users exist', fakeAsync(() => {
      const mockUser1 = { id: 1, username: 'admin' } as User;
      const mockUser2 = { id: 2, username: 'user1' } as User;

      jest.spyOn(userService, 'getUserByNameCached')
        .mockReturnValueOnce(of(mockUser1))
        .mockReturnValueOnce(of(mockUser2));

      const control = new FormControl(['admin', 'user1']);
      const validator = spectator.service.validateUsersExist();

      let result: ValidationErrors | null = null;
      (validator(control) as Observable<ValidationErrors | null>).subscribe((value: ValidationErrors | null) => {
        result = value;
      });

      tick(300);
      expect(result).toBeNull();
      expect(userService.getUserByNameCached).toHaveBeenCalledWith('admin');
      expect(userService.getUserByNameCached).toHaveBeenCalledWith('user1');
    }));

    it('returns error when users do not exist', fakeAsync(() => {
      jest.spyOn(userService, 'getUserByNameCached')
        .mockReturnValue(throwError(() => new Error('User not found')));

      const control = new FormControl(['nonexistent1', 'nonexistent2']);
      const validator = spectator.service.validateUsersExist();

      let result: ValidationErrors | null = null;
      (validator(control) as Observable<ValidationErrors | null>).subscribe((value: ValidationErrors | null) => {
        result = value;
      });

      tick(300);
      expect(result).toEqual({
        usersDoNotExist: {
          message: 'The following users do not exist: nonexistent1, nonexistent2',
        },
      });
      expect(translateService.instant).toHaveBeenCalledWith(
        'The following users do not exist: {users}',
        { users: 'nonexistent1, nonexistent2' },
      );
    }));

    it('debounces validation calls with default 300ms', fakeAsync(() => {
      const mockUser = { id: 1, username: 'admin' } as User;
      jest.spyOn(userService, 'getUserByNameCached').mockReturnValue(of(mockUser));

      const control = new FormControl(['admin']);
      const validator = spectator.service.validateUsersExist();

      (validator(control) as Observable<ValidationErrors | null>).subscribe();

      tick(300);
      expect(userService.getUserByNameCached).toHaveBeenCalledWith('admin');
      expect(userService.getUserByNameCached).toHaveBeenCalledTimes(1);
    }));
  });

  describe('validateUserExists', () => {
    it('returns null for empty username', fakeAsync(() => {
      const control = new FormControl('');
      const validator = spectator.service.validateUserExists();

      let result: ValidationErrors | null = null;
      (validator(control) as Observable<ValidationErrors | null>).subscribe((value: ValidationErrors | null) => {
        result = value;
      });

      tick(300);
      expect(result).toBeNull();
    }));

    it('returns null when user exists', fakeAsync(() => {
      const mockUser = { id: 1, username: 'admin' } as User;
      jest.spyOn(userService, 'getUserByNameCached').mockReturnValue(of(mockUser));

      const control = new FormControl('admin');
      const validator = spectator.service.validateUserExists();

      let result: ValidationErrors | null = null;
      (validator(control) as Observable<ValidationErrors | null>).subscribe((value: ValidationErrors | null) => {
        result = value;
      });

      tick(300);
      expect(result).toBeNull();
      expect(userService.getUserByNameCached).toHaveBeenCalledWith('admin');
    }));

    it('returns error when user does not exist', fakeAsync(() => {
      jest.spyOn(userService, 'getUserByNameCached')
        .mockReturnValue(throwError(() => new Error('User not found')));

      const control = new FormControl('nonexistent');
      const validator = spectator.service.validateUserExists();

      let result: ValidationErrors | null = null;
      (validator(control) as Observable<ValidationErrors | null>).subscribe((value: ValidationErrors | null) => {
        result = value;
      });

      tick(300);
      expect(result).toEqual({
        userDoesNotExist: {
          message: 'User "nonexistent" does not exist',
        },
      });
      expect(translateService.instant).toHaveBeenCalledWith(
        'User "{username}" does not exist',
        { username: 'nonexistent' },
      );
    }));

    it('debounces validation calls with default 300ms', fakeAsync(() => {
      const mockUser = { id: 1, username: 'admin' } as User;
      jest.spyOn(userService, 'getUserByNameCached').mockReturnValue(of(mockUser));

      const control = new FormControl('admin');
      const validator = spectator.service.validateUserExists();

      (validator(control) as Observable<ValidationErrors | null>).subscribe();

      tick(300);
      expect(userService.getUserByNameCached).toHaveBeenCalledWith('admin');
      expect(userService.getUserByNameCached).toHaveBeenCalledTimes(1);
    }));
  });

  describe('validateGroupExists', () => {
    it('returns null for empty group name', fakeAsync(() => {
      const control = new FormControl('');
      const validator = spectator.service.validateGroupExists();

      let result: ValidationErrors | null = null;
      (validator(control) as Observable<ValidationErrors | null>).subscribe((value: ValidationErrors | null) => {
        result = value;
      });

      tick(300);
      expect(result).toBeNull();
    }));

    it('returns null when group exists', fakeAsync(() => {
      const mockGroup = { id: 1, name: 'admin' } as Group;
      jest.spyOn(userService, 'getGroupByNameCached').mockReturnValue(of(mockGroup));

      const control = new FormControl('admin');
      const validator = spectator.service.validateGroupExists();

      let result: ValidationErrors | null = null;
      (validator(control) as Observable<ValidationErrors | null>).subscribe((value: ValidationErrors | null) => {
        result = value;
      });

      tick(300);
      expect(result).toBeNull();
      expect(userService.getGroupByNameCached).toHaveBeenCalledWith('admin');
    }));

    it('returns error when group does not exist', fakeAsync(() => {
      jest.spyOn(userService, 'getGroupByNameCached')
        .mockReturnValue(throwError(() => new Error('Group not found')));

      const control = new FormControl('nonexistent');
      const validator = spectator.service.validateGroupExists();

      let result: ValidationErrors | null = null;
      (validator(control) as Observable<ValidationErrors | null>).subscribe((value: ValidationErrors | null) => {
        result = value;
      });

      tick(300);
      expect(result).toEqual({
        groupDoesNotExist: {
          message: 'Group "nonexistent" does not exist',
        },
      });
      expect(translateService.instant).toHaveBeenCalledWith(
        'Group "{groupName}" does not exist',
        { groupName: 'nonexistent' },
      );
    }));

    it('debounces validation calls with default 300ms', fakeAsync(() => {
      const mockGroup = { id: 1, name: 'admin' } as Group;
      jest.spyOn(userService, 'getGroupByNameCached').mockReturnValue(of(mockGroup));

      const control = new FormControl('admin');
      const validator = spectator.service.validateGroupExists();

      (validator(control) as Observable<ValidationErrors | null>).subscribe();

      tick(300);
      expect(userService.getGroupByNameCached).toHaveBeenCalledWith('admin');
      expect(userService.getGroupByNameCached).toHaveBeenCalledTimes(1);
    }));
  });
});
