import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { routing } from './credentials.routing';

import { CredentialsComponent } from './credentials.component';

@NgModule({
  declarations: [ CredentialsComponent ],
  imports: [
    CommonModule,
    routing
  ]
})
export class CredentialsModule { }
