import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';

@Injectable()
export class EmptyService {
  private readonly loadingConfig: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant('Loading...'),
  };

  private readonly emptyConfig: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: true,
    title: this.translate.instant('No items have been added yet'),
  };

  private readonly errorConfig: EmptyConfig = {
    type: EmptyType.Errors,
    large: true,
    title: this.translate.instant('Can not retrieve response'),
  };

  private readonly emptySearchResultsConfig: EmptyConfig = {
    title: this.translate.instant('No such items'),
    type: EmptyType.NoSearchResults,
    large: true,
  };

  constructor(private translate: TranslateService) { }

  defaultEmptyConfig(type: EmptyType, title: string): EmptyConfig {
    switch (type) {
      case EmptyType.Loading:
        return this.loadingConfig;
      case EmptyType.Errors:
        return this.errorConfig;
      case EmptyType.NoSearchResults:
        return {
          ...this.emptySearchResultsConfig,
          title: this.translate.instant('No matching {title} found', { title }),
        };
      default:
        return {
          ...this.emptyConfig,
          title: this.translate.instant('No {title} have been added yet', { title }),
        };
    }
  }
}
