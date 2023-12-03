import { TemplateRef, ViewContainerRef, ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { HasRolesDirective } from 'app/directives/common/has-roles/has-roles.directive';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/services/auth/auth.service';

describe('HasRolesDirective', () => {
  let directive: HasRolesDirective;
  let authServiceMock: Partial<AuthService>;
  let templateRefMock: Partial<TemplateRef<unknown>> = {};
  let viewContainerRefMock: Partial<ViewContainerRef> = {
    clear: jest.fn(),
    createEmbeddedView: jest.fn(),
  };
  let cdrMock: Partial<ChangeDetectorRef> = {
    markForCheck: jest.fn(),
  };

  templateRefMock = {};
  viewContainerRefMock = {
    clear: jest.fn(),
    createEmbeddedView: jest.fn(),
  };
  cdrMock = {
    markForCheck: jest.fn(),
  };

  describe('Testing Full Admin role to be able to view each component', () => {
    beforeEach(() => {
      authServiceMock = {
        user$: of({ roles: [Role.FullAdmin] }),
      };

      directive = new HasRolesDirective(
        templateRefMock as TemplateRef<unknown>,
        viewContainerRefMock as ViewContainerRef,
        cdrMock as ChangeDetectorRef,
        authServiceMock as AuthService,
      );
    });

    it('renders components for a Full Admin role', () => {
      directive.ixHasRoles = [Role.DatasetWrite];
      expect(viewContainerRefMock.clear).toHaveBeenCalled();
      expect(viewContainerRefMock.createEmbeddedView).toHaveBeenCalledWith(templateRefMock);
    });
  });

  describe('Testing user with no roles', () => {
    beforeEach(() => {
      authServiceMock = {
        user$: of({ roles: [] }),
      };

      directive = new HasRolesDirective(
        templateRefMock as TemplateRef<unknown>,
        viewContainerRefMock as ViewContainerRef,
        cdrMock as ChangeDetectorRef,
        authServiceMock as AuthService,
      );
    });

    it('not rendering components when user has no roles', () => {
      directive.ixHasRoles = [Role.DatasetWrite];
      expect(viewContainerRefMock.clear).toHaveBeenCalled();
      expect(viewContainerRefMock.createEmbeddedView).not.toHaveBeenCalled();
    });
  });

  describe('Testing edge case: Empty roles array', () => {
    beforeEach(() => {
      authServiceMock = {
        user$: of({ roles: [Role.ReplicationTaskRead] }),
      };

      directive = new HasRolesDirective(
        templateRefMock as TemplateRef<unknown>,
        viewContainerRefMock as ViewContainerRef,
        cdrMock as ChangeDetectorRef,
        authServiceMock as AuthService,
      );
    });

    it('not rendering components when empty roles to check provided', () => {
      directive.ixHasRoles = [];
      expect(viewContainerRefMock.clear).toHaveBeenCalled();
      expect(viewContainerRefMock.createEmbeddedView).not.toHaveBeenCalled();
    });
  });

  describe('Testing non-admin roles', () => {
    beforeEach(() => {
      authServiceMock = {
        user$: of({ roles: [Role.ReplicationTaskWrite, Role.SharingNfsRead] }),
      };

      directive = new HasRolesDirective(
        templateRefMock as TemplateRef<unknown>,
        viewContainerRefMock as ViewContainerRef,
        cdrMock as ChangeDetectorRef,
        authServiceMock as AuthService,
      );
    });

    it('renders component because of ReplicationTaskWrite role when only ReplicationTaskRead is required', () => {
      directive.ixHasRoles = [Role.ReplicationTaskRead];
      expect(viewContainerRefMock.clear).toHaveBeenCalled();
      expect(viewContainerRefMock.createEmbeddedView).toHaveBeenCalledWith(templateRefMock);
    });

    it('not rendering component because of SharingNfsWrite role expected but user has SharingNfsRead only', () => {
      directive.ixHasRoles = [Role.SharingNfsWrite];
      expect(viewContainerRefMock.clear).toHaveBeenCalled();
      expect(viewContainerRefMock.createEmbeddedView).not.toHaveBeenCalled();
    });
  });
});
