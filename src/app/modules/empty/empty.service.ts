import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';

@Injectable({
  providedIn: 'root',
})
export class EmptyService {
  constructor(private translate: TranslateService) { }

  defaultEmptyConfig(type?: EmptyType | null): EmptyConfig {
    switch (type) {
      case EmptyType.Loading:
        return {
          type: EmptyType.Loading,
          large: false,
          title: this.translate.instant('Loading...'),
        };
      case EmptyType.Errors:
        return {
          type: EmptyType.Errors,
          large: true,
          title: this.translate.instant('Can not retrieve response'),
        };
      case EmptyType.NoSearchResults:
        return {
          title: this.translate.instant('No matching results found'),
          type: EmptyType.NoSearchResults,
          large: true,
        };
      default:
        return {
          title: this.translate.instant('No records have been added yet'),
          type: EmptyType.NoPageData,
          large: true,
        };
    }
  }
}
