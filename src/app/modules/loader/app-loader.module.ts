import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { AppLoaderComponent } from 'app/modules/loader/components/app-loader/app-loader.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { AppLoaderService } from 'app/services';

@NgModule({
  imports: [
    CommonModule,
    CoreComponents,
    MatDialogModule,
    IxIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
    MatProgressBarModule,
  ],
  providers: [AppLoaderService],
  declarations: [
    AppLoaderComponent,
    FakeProgressBarComponent,
  ],
  exports: [
    AppLoaderComponent,
    FakeProgressBarComponent,
  ],
})
export class AppLoaderModule { }
