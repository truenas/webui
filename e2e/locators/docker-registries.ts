/**
 * Apps > Configuration > Sign-in to a Docker registry (`/apps/docker-registries`): the registry list
 * and the side panel its Add Registry and Edit open.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

export const dockerRegistriesLocators = {
  addRegistry: '[data-test="button-add-docker-registry"]',

  /**
   * One registry, by the URI middleware stored and its name.
   *
   * The row tag is `toUniqueRowTag('docker-registry-<uri>-<name>')`, which lowercases the tag before
   * lodash kebabs it, so it is lowercased here too: lodash alone would split `MyName` into `my-name`.
   * Edit and Delete are `[name, 'edit']` through the library's normalizer, which spells the name
   * differently (`e2e`, not `e-2-e`).
   */
  registry: (uri: string, name: string): {
    row: string;
    name: string;
    uri: string;
    edit: string;
    delete: string;
  } => {
    const rowTag = legacyKebabTestSegment(`docker-registry-${uri}-${name}`.toLowerCase());
    const button = kebabTestSegment(name);
    return {
      row: `[data-test="row-${rowTag}"]`,
      name: `[data-test="text-name-${rowTag}-row-text"]`,
      uri: `[data-test="text-uri-${rowTag}-row-text"]`,
      edit: `[data-test="button-${button}-edit"]`,
      delete: `[data-test="button-${button}-delete"]`,
    };
  },
} as const;

/** `docker-registry-form.component.html`, in the side panel Add Registry and Edit both open. */
export const dockerRegistryFormLocators = {
  /**
   * "URI": Docker Hub or Other Registry. Rendered only when adding, and only while no Docker Hub
   * registry is stored.
   */
  registry: '[data-test="select-registry"]',
  otherRegistry: '[data-test="option-registry-other-registry"]',

  /** Rendered once Other Registry is chosen, and always when editing. Validated on blur. */
  uri: '[data-test="input-uri"]',
  /** The field around {@link uri}, `testId="uri"`, which holds its error text. */
  uriField: '[data-test="form-field-uri"]',
  name: '[data-test="input-name"]',
  username: '[data-test="input-username"]',
  password: '[data-test="input-password"]',

  /** The side panel's Save, `[testId]="'save'"` in form-side-panel-container. Disabled while the form is invalid. */
  save: '[data-test="button-save"]',
} as const;
