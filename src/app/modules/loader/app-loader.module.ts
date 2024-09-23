import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { AppLoaderComponent } from 'app/modules/loader/components/app-loader/app-loader.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { WithLoadingStateErrorComponent } from './directives/with-loading-state/with-loading-state-error/with-loading-state-error.component';
import { WithLoadingStateLoaderComponent } from './directives/with-loading-state/with-loading-state-loader/with-loading-state-loader.component';

@NgModule({
  imports: [
    MatDialogModule,
    IxIconComponent,
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
