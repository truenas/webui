import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { UserListComponent } from 'app/pages/credentials/new-users/user-list/user-list.component';

@Component({
  selector: 'ix-all-users',
  templateUrl: './all-users.component.html',
  styleUrls: ['./all-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MasterDetailViewComponent,
    TranslateModule,
    PageHeaderComponent,
    UserListComponent,
  ],
})
export class AllUsersComponent {}
