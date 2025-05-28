import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { noSearchResultsConfig } from 'app/constants/empty-configs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';

@Injectable({
  providedIn: 'root',
})
export class EmptyService {
  constructor(private translate: TranslateService) { }

  defaultEmptyConfig(type?: EmptyType | null, defaultConfig?: EmptyConfig): EmptyConfig {
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
          title: this.translate.instant('Cannot retrieve response'),
        };
      case EmptyType.NoSearchResults:
        return noSearchResultsConfig;
      default:
        return defaultConfig || {
          title: this.translate.instant('No records have been added yet'),
          type: EmptyType.NoPageData,
          large: true,
        };
    }
  }
}
