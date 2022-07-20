import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { AppLoaderComponent } from 'app/modules/loader/components/app-loader/app-loader.component';
import { FakeProgressBarComponent } from './components/fake-progress-bar/fake-progress-bar.component';

@NgModule({
  imports: [
    CommonModule,
    CoreComponents,
    MatDialogModule,
    MatIconModule,
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
