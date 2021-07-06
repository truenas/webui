import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { MaterialModule } from 'app/appMaterial.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AppConfirmModule } from 'app/services/app-confirm/app-confirm.module';
import { UserService } from 'app/services/user.service';
import { EntityModule } from '../common/entity/entity.module';
import { ServiceDDNSComponent } from './components/service-dynamicdns/service-dynamicdns.component';
import { ServiceFTPComponent } from './components/service-ftp/service-ftp.component';
import { ServiceLLDPComponent } from './components/service-lldp/service-lldp.component';
import { ServiceNFSComponent } from './components/service-nfs/service-nfs.component';
import { CconfigureRYSNCComponent } from './components/service-rsync/rsyncconfiguration/configure_rsync/configure_rsync.component';
import { RSYNCconfigurationListComponent } from './components/service-rsync/rsyncconfiguration/rsyncconfiguration-list/rsyncconfiguration-list.component';
import { RYSNCConfigurationFormComponent } from './components/service-rsync/rsyncconfiguration/rsyncmodule/rsyncconfiguration-form.component';
import { ServiceRSYNCComponent } from './components/service-rsync/service-rsync.component';
import { ServiceS3Component } from './components/service-s3/service-s3.component';
import { ServiceSMARTComponent } from './components/service-smart/service-smart.component';
import { ServiceSMBComponent } from './components/service-smb/service-smb.component';
import { ServiceSNMPComponent } from './components/service-snmp/service-snmp.component';
import { ServiceSSHComponent } from './components/service-ssh/service-ssh.component';
import { ServiceTFTPComponent } from './components/service-tftp/service-tftp.component';
import { ServiceUPSComponent } from './components/service-ups/service-ups.component';
import { ServiceWebdavComponent } from './components/service-webdav/service-webdav.component';
import { Services } from './services.component';
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
  ],
  declarations: [
    Services,
    ServiceSSHComponent,
    ServiceFTPComponent,
    ServiceLLDPComponent,
    ServiceRSYNCComponent,
    CconfigureRYSNCComponent,
    RSYNCconfigurationListComponent,
    RYSNCConfigurationFormComponent,
    ServiceSMARTComponent,
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
