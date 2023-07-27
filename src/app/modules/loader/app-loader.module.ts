import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CoreComponents } from 'app/core/core-components.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { AppLoaderComponent } from 'app/modules/loader/components/app-loader/app-loader.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { WithLoadingStateErrorComponent } from './directives/with-loading-state/with-loading-state-error/with-loading-state-error.component';
import { WithLoadingStateLoaderComponent } from './directives/with-loading-state/with-loading-state-loader/with-loading-state-loader.component';

@NgModule({
  imports: [
    CommonModule,
    CoreComponents,
    MatDialogModule,
    IxIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
    MatProgressBarModule,
    NgxSkeletonLoaderModule,
  ],
  providers: [AppLoaderService],
  declarations: [
    AppLoaderComponent,
    FakeProgressBarComponent,
    WithLoadingStateDirective,
    WithLoadingStateErrorComponent,
    WithLoadingStateLoaderComponent,
  ],
  exports: [
    AppLoaderComponent,
    FakeProgressBarComponent,
    WithLoadingStateDirective,
  ],
})
export class AppLoaderModule { }
