import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import {
  ActivatedRoute, NavigationEnd, NavigationSkipped, Router,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs';

@UntilDestroy()
@Component({
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralSettingsComponent implements OnInit, AfterViewInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd || event instanceof NavigationSkipped),
      untilDestroyed(this),
    ).subscribe(() => {
      this.handleFragment(this.route.snapshot.fragment);
    });
  }

  ngAfterViewInit(): void {
    this.handleFragment(this.route.snapshot.fragment);
  }

  private handleFragment(fragment: string): void {
    const emailSettingsButton = this.document.getElementById('email-settings');
    if (fragment === 'email' && emailSettingsButton) {
      emailSettingsButton.click();
    }
    const guiSettingsButton = this.document.getElementById('gui-settings');
    if (fragment === 'gui' && guiSettingsButton) {
      guiSettingsButton.click();
    }
  }
}
