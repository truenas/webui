import { Observable } from 'rxjs';

export type ChipsProvider = (query: string) => Observable<string[]>;
