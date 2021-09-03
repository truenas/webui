import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { SiblingInfo } from 'app/pages/system/general-settings/localization-form3/interfaces/sibling-info.interface';

@Injectable()
export class Localization3Service {
  getSiblingInfo(name: string): Observable<SiblingInfo> {
    return of({
      name,
      siblings: {
        John: 'john',
        Roger: 'roger',
        Stepheny: 'stepheny',
      },
      favorite: 'roger',
    });
  }

  saveSiblingInfo(siblingInfo: SiblingInfo): Observable<any> {
    siblingInfo;
    return of(siblingInfo).pipe(delay(2000));
  }
}
