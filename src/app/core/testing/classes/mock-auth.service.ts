import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';

@Injectable()
export class MockAuthService {
  loggedInUser$ = new BehaviorSubject<LoggedInUser | null>(null);
  refreshUser = jest.fn(() => of(undefined));
  clearAuthToken = jest.fn();
  login = jest.fn();
  logout = jest.fn();
  hasRole = jest.fn((role: Role) => {
    const currentUser = this.loggedInUser$.getValue();
    const hasRole = currentUser?.privilege?.roles?.$set?.includes(role) || false;
    return of(hasRole);
  });

  isAuthenticated$ = of(true);
  user$ = this.loggedInUser$.asObservable();
  setUser(user: LoggedInUser): void {
    this.loggedInUser$.next(user);
  }

  setRoles(roles: Role[]): void {
    const currentUser = this.loggedInUser$.getValue();
    this.loggedInUser$.next({
      ...currentUser,
      privilege: {
        ...(currentUser?.privilege || {}),
        roles: {
          $set: roles,
        },
      },
    } as LoggedInUser);
  }
}
