import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {BusyModule} from 'tixif-ngx-busy';
import {AlertModule} from 'ngx-bootstrap/alert';
import {ModalModule} from 'ngx-bootstrap/modal';
import {ProgressbarModule} from 'ngx-bootstrap/progressbar';
import {NgUploaderModule} from 'ngx-uploader';
import { Ng2DropdownModule } from 'ng2-material-dropdown';

import {
  BaCard,
  BaChartistChart,
  BaCheckbox,
  BaContentTop,
  BaJob,
  BaMenu,
  BaMenuItem,
  BaMsgCenter,
  BaMultiCheckbox,
  BaPageTop,
  BaPictureUploader,
  BaSidebar,
  BaBackTop
} from './components';
import {BaCardBlur} from './components/baCard/baCardBlur.directive';
import {BaScrollPosition, BaSlimScroll, BaThemeRun} from './directives';
import {
  BaAppPicturePipe,
  BaKameleonPicturePipe,
  BaProfilePicturePipe
} from './pipes';
import {
  BaImageLoaderService,
  BaMenuService,
  BaThemePreloader,
  BaThemeSpinner
} from './services';
import {BaThemeConfig} from './theme.config';
import {BaThemeConfigProvider} from './theme.configProvider';
import {EmailValidator, EqualPasswordsValidator} from './validators';

const NGA_COMPONENTS = [
  BaCard, BaChartistChart, BaCheckbox, BaContentTop, BaJob,
  BaMenuItem, BaMenu, BaMsgCenter, BaMultiCheckbox, BaPageTop,
  BaPictureUploader, BaSidebar, BaBackTop
];

const NGA_DIRECTIVES =
    [ BaScrollPosition, BaSlimScroll, BaThemeRun, BaCardBlur ];

const NGA_PIPES =
    [ BaAppPicturePipe, BaKameleonPicturePipe, BaProfilePicturePipe ];

const NGA_SERVICES =
    [ BaImageLoaderService, BaThemePreloader, BaThemeSpinner, BaMenuService ];

const NGA_VALIDATORS = [ EmailValidator, EqualPasswordsValidator ];

@NgModule({
  declarations : [...NGA_PIPES, ...NGA_DIRECTIVES, ...NGA_COMPONENTS ],
  imports : [
    CommonModule,
    RouterModule,
    Ng2DropdownModule,
    FormsModule,
    ReactiveFormsModule,
    NgUploaderModule,
    AlertModule.forRoot(),
    BusyModule,
    ModalModule.forRoot(),
    ProgressbarModule.forRoot(),
  ],
  exports : [
    AlertModule,
    BusyModule,
    ...NGA_PIPES,
    ...NGA_DIRECTIVES,
    ...NGA_COMPONENTS,

  ]
})
export class NgaModule {
  static forRoot(): ModuleWithProviders {
    return <ModuleWithProviders>{
      ngModule : NgaModule,
      providers : [
        BaThemeConfigProvider, BaThemeConfig, ...NGA_VALIDATORS, ...NGA_SERVICES
      ],
    };
  }
}
