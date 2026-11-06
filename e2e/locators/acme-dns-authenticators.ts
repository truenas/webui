/**
 * The ACME DNS-Authenticators card on Credentials > Certificates, and its form. Row ids come from the card's
 * `uniqueRowTag`, `amce-dns-<name>`: "amce" is a typo kept on purpose, since renaming a resolved `data-test`
 * breaks outside consumers (`e2e/CLAUDE.md`). No pre-normalizing, so use {@link kebabTestSegment} throughout.
 * Provider fields come from `ix-dynamic-form`, one `tn-input` per schema field named after it (Cloudflare's
 * `api_token` is `input-api-token`).
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
