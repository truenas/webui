/**
 * The ACME DNS-Authenticators card on Credentials > Certificates, and its form.
 *
 * Every id on a row is built from the card's own `uniqueRowTag`,
 * `amce-dns-<name>` — "amce", a typo, and the id as it resolves today. It is
 * kept rather than corrected, because renaming a resolved `data-test` is a
 * breaking change for anything outside this repository that selects it (see
 * `e2e/CLAUDE.md`). A plain concatenation with no pre-normalizing, so
 * {@link kebabTestSegment} is the one to use throughout.
 *
 * The form's provider fields are not in its template: `ix-dynamic-form` renders
 * one `tn-input` per field of the selected provider's schema, tagged with the
 * field's name, so Cloudflare's `api_token` is `input-api-token`.
 */
import { kebabTestSegment } from './test-id';

function rowTag(name: string): string {
  return kebabTestSegment(`amce-dns-${name}`);
}

/**
 * The card lists four authenticators before its Show More pager
 * (`[pageSize]="4"`), oldest first, so a fifth row is not on screen until the
 * pager is used.
 */
export const acmeDnsCardPageSize = 4;

export const acmeDnsLocators = {
  card: {
    /** `<tn-button [testId]="['add-acme-dns-authenticator']">` in the card footer. */
    add: '[data-test="button-add-acme-dns-authenticator"]',

    row: (name: string): string => `[data-test="row-${rowTag(name)}"]`,

    name: (name: string): string => `[data-test="text-name-${rowTag(name)}-row-text"]`,

    /** The provider, as middleware names it — `cloudflare`. */
    authenticator: (name: string): string => `[data-test="text-authenticator-${rowTag(name)}-row-text"]`,

    /**
     * The row's own Edit and Delete. The card asks for `mode="inline"`, so they
     * sit on the row rather than in a kebab menu: the row tag, the icon with its
     * library, then `row-action`.
     */
    edit: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-pencil-row-action"]`,
    delete: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-delete-row-action"]`,
  },

  form: {
    name: '[data-test="input-name"]',

    /** Cloudflare's fields, rendered by `ix-dynamic-form`. Cloudflare is the provider selected by default. */
    apiToken: '[data-test="input-api-token"]',
    apiKey: '[data-test="input-api-key"]',
    cloudflareEmail: '[data-test="input-cloudflare-email"]',

    /** `<tn-banner [testId]="'cloudflare-mutually-exclusive'">`: shown while both a token and a key are filled. */
    mutuallyExclusive: '[data-test="banner-cloudflare-mutually-exclusive"]',

    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
