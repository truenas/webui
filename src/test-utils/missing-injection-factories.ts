import { Observable, throwError } from 'rxjs';

export function getMissingInjectionErrorFactory(className: string): () => Observable<unknown> {
  return function getMissingInjectionError(): Observable<unknown> {
    return getMissingInjectionErrorObservable(className);
  };
}

export function getMissingInjectionErrorObservable(className: string): Observable<never> {
  return throwError(() => new Error(`${className} injection not provided`));
}
