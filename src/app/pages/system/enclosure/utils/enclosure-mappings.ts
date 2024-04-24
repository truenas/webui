import { ComponentType } from '@angular/cdk/portal';
import { M50EnclosureComponent } from 'app/pages/system/enclosure/components/enclosures/m50-enclosure/m50-enclosure.component';

export const enclosureComponentMap: Record<string, ComponentType<unknown>> = {
  M50: M50EnclosureComponent,
};
