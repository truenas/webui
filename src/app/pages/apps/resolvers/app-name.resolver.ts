import {
  ActivatedRouteSnapshot,
  ResolveFn,
} from '@angular/router';
import { Observable, of } from 'rxjs';

export const appNameResolver: ResolveFn<string> = (
  route: ActivatedRouteSnapshot,
): Observable<string> => {
  return of(route.paramMap.get('appId'));
};
