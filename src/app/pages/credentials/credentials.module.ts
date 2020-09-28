import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { routing } from './credentials.routing';
import { MatCardModule } from '@angular/material/card';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatDividerModule } from "@angular/material/divider";
import { TranslateModule } from '@ngx-translate/core';
import { EntityModule } from '../common/entity/entity.module';
import { MaterialModule } from '../../appMaterial.module';
import { CommonDirectivesModule } from '../../directives/common/common-directives.module';

import { CredentialsComponent } from './credentials.component';
import { BackupCredentialsComponent } from './backup-credentials/backup-credentials.component';
import { SshConnectionsFormComponent } from './backup-credentials/forms/ssh-connections-form.component';
import { CloudCredentialsFormComponent } from './backup-credentials/forms/cloud-credentials-form.component';
import { SshKeypairsFormComponent } from './backup-credentials/forms/ssh-keypairs-form.component';
import { CertificatesDashComponent } from './certificates-dash/certificates-dash.component';

@NgModule({
  declarations: [ CredentialsComponent, BackupCredentialsComponent, SshConnectionsFormComponent, 
    CloudCredentialsFormComponent, SshKeypairsFormComponent, CertificatesDashComponent ],
  imports: [
    CommonModule,
    MatCardModule,
    FlexLayoutModule,
    MatDividerModule,
    routing,
    TranslateModule,
    EntityModule,
    MaterialModule,
    CommonDirectivesModule
  ]
})
export class CredentialsModule { }
