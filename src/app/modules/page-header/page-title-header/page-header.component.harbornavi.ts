import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'ix-page-header',
  template: `
    <header class="harbornavi-page-header">
      <div>
        <p class="eyebrow">HarborNavi</p>
        <h1>{{ currentTitle() | translate }}</h1>
      </div>
      <div class="actions">
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
    }

    .harbornavi-page-header {
      align-items: center;
      background: var(--bg1);
      border-bottom: 1px solid var(--lines);
      display: flex;
      gap: 16px;
      justify-content: space-between;
      min-height: 76px;
      padding: 18px 20px;
    }

    .eyebrow {
      color: var(--alt-fg1);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0;
      margin: 0 0 4px;
      text-transform: uppercase;
    }

    h1 {
      color: var(--fg1);
      font-size: 24px;
      font-weight: 700;
      line-height: 1.2;
      margin: 0;
    }

    .actions {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
    }

    @media (max-width: 680px) {
      .harbornavi-page-header {
        align-items: flex-start;
        flex-direction: column;
      }

      .actions {
        justify-content: flex-start;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
})
export class PageHeaderComponent {
  readonly pageTitle = input<string>();
  readonly loading = input(false);

  protected readonly currentTitle = computed(() => this.pageTitle() || 'Harbor Assistant');
}
