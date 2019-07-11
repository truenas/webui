import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDialogModule, MatIconModule, MatProgressSpinnerModule } from '@angular/material';
import { CoreComponents } from 'app/core/components/corecomponents.module';
import { AppLoaderComponent } from './app-loader.component';
import { AppLoaderService } from './app-loader.service';

@NgModule({
  imports: [
    CommonModule,
    CoreComponents,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  providers: [AppLoaderService],
  declarations: [AppLoaderComponent],
  entryComponents: [AppLoaderComponent]
})
export class AppLoaderModule { }
