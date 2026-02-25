import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'ix-harbor-icon, harbor-icon',
  standalone: true,
  templateUrl: './harbor-icon.component.html',
  styleUrls: ['./harbor-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HarborIconComponent {
  readonly name = input<string | undefined>('');

  readonly iconPath = computed(() => {
    const iconName = this.normalizeName(this.name());
    return `assets/icons/custom/${iconName}.svg`;
  });

  private normalizeName(name: string): string {
    if (!name) {
      return '';
    }

    const namespacedName = name.includes(':') ? name.split(':').at(-1) ?? '' : name;

    if (namespacedName.startsWith('app-')) {
      return namespacedName.slice(4);
    }

    if (namespacedName.startsWith('ix-')) {
      return namespacedName.slice(3);
    }

    if (namespacedName.startsWith('tn-')) {
      return namespacedName.slice(3);
    }

    return namespacedName;
  }
}
