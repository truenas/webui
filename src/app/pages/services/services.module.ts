import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { MaterialModule } from 'app/app-material.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { ServiceDDNSComponent } from 'app/pages/services/components/service-dynamicdns/service-dynamicdns.component';
import { ServiceFTPComponent } from 'app/pages/services/components/service-ftp/service-ftp.component';
import { ServiceLLDPComponent } from 'app/pages/services/components/service-lldp/service-lldp.component';
import { ServiceNFSComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { CconfigureRYSNCComponent } from 'app/pages/services/components/service-rsync/rsync-configuration/configure-rsync/configure-rsync.component';
import { RsyncConfigurationListComponent } from 'app/pages/services/components/service-rsync/rsync-configuration/rsync-configuration-list/rsync-configuration-list.component';
import { RYSNCConfigurationFormComponent } from 'app/pages/services/components/service-rsync/rsync-configuration/rsyncmodule/rsync-configuration-form.component';
import { ServiceRSYNCComponent } from 'app/pages/services/components/service-rsync/service-rsync.component';
import { ServiceS3Component } from 'app/pages/services/components/service-s3/service-s3.component';
import { ServiceSMBComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { ServiceSNMPComponent } from 'app/pages/services/components/service-snmp/service-snmp.component';
import { ServiceSSHComponent } from 'app/pages/services/components/service-ssh/service-ssh.component';
import { ServiceTFTPComponent } from 'app/pages/services/components/service-tftp/service-tftp.component';
import { ServiceUPSComponent } from 'app/pages/services/components/service-ups/service-ups.component';
import { ServiceWebdavComponent } from 'app/pages/services/components/service-webdav/service-webdav.component';
import { AppConfirmModule } from 'app/services/app-confirm/app-confirm.module';
import { UserService } from 'app/services/user.service';
import { EntityModule } from '../common/entity/entity.module';
import { IxFormsModule } from '../common/ix-forms/ix-forms.module';
import { ServiceSmartComponent } from './components/service-smart/service-smart.component';
import { ServicesComponent } from './services.component';
import { routing } from './services.routing';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    EntityModule,
    routing,
    MaterialModule,
    AppConfirmModule,
    NgxDatatableModule,
    TranslateModule,
    CommonDirectivesModule,
    IxFormsModule,
    ReactiveFormsModule,
  ],
  declarations: [
    ServicesComponent,
    ServiceSSHComponent,
    ServiceFTPComponent,
    ServiceLLDPComponent,
    ServiceRSYNCComponent,
    CconfigureRYSNCComponent,
    RsyncConfigurationListComponent,
    RYSNCConfigurationFormComponent,
    ServiceSmartComponent,
    ServiceNFSComponent,
    ServiceTFTPComponent,
    ServiceUPSComponent,
    ServiceDDNSComponent,
    ServiceSMBComponent,
    ServiceSNMPComponent,
    ServiceWebdavComponent,
    ServiceS3Component,
  ],
  providers: [UserService],
})
export class ServicesModule {
}
