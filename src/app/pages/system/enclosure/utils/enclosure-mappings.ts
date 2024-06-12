import { ComponentType } from '@angular/cdk/portal';
import { EnclosureViewDirective } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosures/enclosure-view/enclosure-view.directive';
import { M50FrontViewComponent } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosures/m50-enclosure/m50-front-view/m50-front-view.component';
import { M50RearViewComponent } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosures/m50-enclosure/m50-rear-view/m50-rear-view.component';

export enum EnclosureSide {
  Front = 'front',
  Rear = 'rear',
  Top = 'top',
  Internal = 'internal',
}

export type EnclosureViewOptions = {
  [key in EnclosureSide]?: ComponentType<EnclosureViewDirective>;
};

/**
 * A map for assigning enclosure-view components to enclosure model names. This map will handle expansion shelves
 * and other models the same way. E.g., a M50 encosure view with an ES12 expansion shelf will use the following
 * mapping.
 * {
 *    ...
 *    M50: M50EnclosureComponent,
 *    ...
 *    ES12: Es12EnclosureComponent,
 *    ...
 * }
 * The enclosure-dashboard component will be responsible for choosing the enclosure-view component based on the
 * currently selected enclosure model.
 *
 * For models with a front/rear view, a separate model mapping isn't required. front/rear views can be handled
 * inside of the enclosure-component. E.g., M50 has a front and a rear view. We will only have one mapping for M50.
 * M50 -> M50EnclosureComponent
 * M50EnclosureComponent is expected to handle front/rear views and provide buttons to switch between the two views.
 */
export const enclosureComponentMap: Record<string, EnclosureViewOptions> = {
  M50: { front: M50FrontViewComponent, rear: M50RearViewComponent },
};
