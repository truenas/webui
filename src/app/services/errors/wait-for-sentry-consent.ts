import { BehaviorSubject } from 'rxjs';

export const waitForConsent$ = new BehaviorSubject<boolean | null>(null);
