import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  errorsConfig, loadingConfig, noItemsConfig, noSearchResultsConfig,
} from 'app/constants/empty-configs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';

@Injectable({
  providedIn: 'root',
})
export class EmptyService {
  private translate = inject(TranslateService);


  defaultEmptyConfig(type?: EmptyType | null): EmptyConfig {
    switch (type) {
      case EmptyType.Loading:
        return loadingConfig;
      case EmptyType.Errors:
        return errorsConfig;
      case EmptyType.NoSearchResults:
        return noSearchResultsConfig;
      default:
        return noItemsConfig;
    }
  }
}
