import {
  ActivatedRouteSnapshot,
  ResolveFn,
} from '@angular/router';
import { Observable, of } from 'rxjs';

export const appNameResolver: ResolveFn<string | null> = (
  route: ActivatedRouteSnapshot,
): Observable<string | null> => {
  return of(route.paramMap.get('appId'));
};
