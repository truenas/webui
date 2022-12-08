import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { ServiceDynamicDnsComponent } from 'app/pages/services/components/service-dynamic-dns/service-dynamic-dns.component';
import { ServiceFtpComponent } from 'app/pages/services/components/service-ftp/service-ftp.component';
import { ServiceLldpComponent } from 'app/pages/services/components/service-lldp/service-lldp.component';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { RsyncConfigureComponent } from 'app/pages/services/components/service-rsync/rsync-configure/rsync-configure.component';
import { RsyncModuleFormComponent } from 'app/pages/services/components/service-rsync/rsync-module-form/rsync-module-form.component';
import { RsyncModuleListComponent } from 'app/pages/services/components/service-rsync/rsync-module-list/rsync-module-list.component';
import { ServiceRsyncComponent } from 'app/pages/services/components/service-rsync/service-rsync.component';
import { ServiceS3Component } from 'app/pages/services/components/service-s3/service-s3.component';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { ServiceSnmpComponent } from 'app/pages/services/components/service-snmp/service-snmp.component';
import { ServiceSshComponent } from 'app/pages/services/components/service-ssh/service-ssh.component';
import { ServiceTftpComponent } from 'app/pages/services/components/service-tftp/service-tftp.component';
import { ServiceUpsComponent } from 'app/pages/services/components/service-ups/service-ups.component';
import { ServiceWebdavComponent } from 'app/pages/services/components/service-webdav/service-webdav.component';
import { ServiceSmartComponent } from './components/service-smart/service-smart.component';
import { ServicesComponent } from './services.component';
import { routing } from './services.routing';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    EntityModule,
    routing,
    TranslateModule,
    CommonDirectivesModule,
    IxFormsModule,
    IxIconModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatProgressBarModule,
    MatTabsModule,
    ReactiveFormsModule,
    IxTableModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    AppCommonModule,
    LayoutModule,
  ],
  declarations: [
    ServicesComponent,
    ServiceSshComponent,
    ServiceFtpComponent,
    ServiceLldpComponent,
    ServiceRsyncComponent,
    RsyncConfigureComponent,
    RsyncModuleListComponent,
    RsyncModuleFormComponent,
    ServiceSmartComponent,
    ServiceNfsComponent,
    ServiceTftpComponent,
    ServiceUpsComponent,
    ServiceDynamicDnsComponent,
    ServiceSmbComponent,
    ServiceSnmpComponent,
    ServiceWebdavComponent,
    ServiceS3Component,
  ],
})
export class ServicesModule {
}
