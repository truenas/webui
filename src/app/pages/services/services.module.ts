import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { ServiceFtpComponent } from 'app/pages/services/components/service-ftp/service-ftp.component';
import { AddSpnDialogComponent } from 'app/pages/services/components/service-nfs/add-spn-dialog/add-spn-dialog.component';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { ServiceSnmpComponent } from 'app/pages/services/components/service-snmp/service-snmp.component';
import { ServiceSshComponent } from 'app/pages/services/components/service-ssh/service-ssh.component';
import { ServiceUpsComponent } from 'app/pages/services/components/service-ups/service-ups.component';
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
    LayoutModule,
    MatDialogModule,
    TooltipModule,
    TestIdModule,
    SearchInput1Component,
    IxTable2Module,
  ],
  declarations: [
    ServicesComponent,
    ServiceSshComponent,
    ServiceFtpComponent,
    ServiceSmartComponent,
    ServiceNfsComponent,
    ServiceUpsComponent,
    ServiceSmbComponent,
    ServiceSnmpComponent,
    AddSpnDialogComponent,
  ],
})
export class ServicesModule {
}
