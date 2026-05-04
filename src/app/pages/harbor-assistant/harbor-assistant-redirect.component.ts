import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'ix-harbor-assistant-redirect',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HarborAssistantRedirectComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const queryParams = { ...this.route.snapshot.queryParams };
    const targetTab = this.route.snapshot.data['assistantTab'] as string | undefined;
    if (targetTab) {
      queryParams['tab'] = targetTab;
    }

    this.router.navigate(['/harbor-assistant'], {
      queryParams,
      replaceUrl: true,
    });
  }
}
