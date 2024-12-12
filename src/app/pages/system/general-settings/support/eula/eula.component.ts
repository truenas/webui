import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { eulaElements } from 'app/pages/system/general-settings/support/eula/eula.elements';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-eula',
  templateUrl: './eula.component.html',
  styleUrls: ['./eula.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    UiSearchDirective,
    MatDivider,
    MatCardActions,
    MatButton,
    TestDirective,
    RouterLink,
    TranslateModule,
  ],
})
export class EulaComponent implements OnInit {
  eula: string;
  protected readonly searchableElements = eulaElements;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.api.call('truenas.get_eula').pipe(untilDestroyed(this)).subscribe((eula) => {
      this.eula = eula;
      this.cdr.markForCheck();
    });
  }
}
