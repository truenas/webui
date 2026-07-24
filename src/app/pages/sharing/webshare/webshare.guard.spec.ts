import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree,
} from '@angular/router';
import { mockProvider } from '@ngneat/spectator/jest';
import { firstValueFrom, Observable, of } from 'rxjs';
import { webShareGuard } from 'app/pages/sharing/webshare/webshare.guard';
import { LicenseService } from 'app/services/license.service';

describe('webShareGuard', () => {
  function setup(shouldShowWebshare: boolean): Promise<boolean | UrlTree> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        mockProvider(LicenseService, {
          shouldShowWebshare$: of(shouldShowWebshare),
        }),
      ],
    });

    const result$ = TestBed.runInInjectionContext(() => {
      return webShareGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
    });
    return firstValueFrom(result$ as Observable<boolean | UrlTree>);
  }

  it('allows activation when WebShare should be shown', async () => {
    await expect(setup(true)).resolves.toBe(true);
  });

  it('redirects to the shares dashboard when WebShare should be hidden', async () => {
    const result = await setup(false);

    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/sharing');
  });
});
