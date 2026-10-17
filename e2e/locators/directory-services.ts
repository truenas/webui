/**
 * Credentials > Directory Services: the page's disabled state, the
 * Directory Services Configuration form, its Advanced Settings, the Kerberos
 * Realms and Kerberos Keytab cards inside them, and the two cards' forms.
 *
 * The configuration form's controls pass snake_case `testId`s, which the
 * library kebab-cases (`service_type` → `select-service-type`). A `tn-select`
 * option is `option-<base>-<label>`, keyed by the label on screen, so the option
 * locators take one of the label maps below.
 *
 * Every id on a row is built from its card's own `uniqueRowTag` —
 * `kerberos-realm-<realm>` and `kerberos-keytab-<name>` — run through
 * `convertStringToId` and then the library's normalizer. `convertStringToId`
 * lowercases **first**, so the tag is lowercased here before
 * {@link kebabTestSegment} sees it: on the raw name that splits a digit from the
 * capital after it, and realm `E2E-REALM.TEST` would come out `e2-e-realm-test`
 * where the app renders `kerberos-realm-e2e-realm-test`.
 *
 * Both cards ask for `mode="inline"`, so Edit and Delete are icon buttons on the
 * row rather than items in a kebab menu, and their ids have no `more-action`.
 */
import { kebabTestSegment } from './test-id';

/** The Configuration Type labels, as `configurationTypeOptions$` hard-codes them. */
export const directoryServiceTypeLabels = {
  activeDirectory: 'Active Directory',
  ldap: 'LDAP',
  ipa: 'IPA',
} as const;

/** The Credential Type labels, from `credentialTypeLabels`. */
export const credentialTypeLabels = {
  kerberosUser: 'Kerberos User',
  kerberosPrincipal: 'Kerberos Principal',
  ldapPlain: 'LDAP Plain',
  ldapAnonymous: 'LDAP Anonymous',
  ldapMtls: 'LDAP MTLS',
} as const;

/** The IDMAP Backend labels, from `domainIdmapTypeOptions`. */
export const idmapBackendLabels = {
  ad: 'AD (RFC2307/SFU attributes from Active Directory)',
  rfc2307: 'RFC2307 (RFC2307 attributes from a standalone LDAP server)',
  rid: 'RID (Default - algorithmic mapping based on RID values)',
} as const;

/** The LDAP Schema labels: the `LdapSchema` values themselves. */
export const ldapSchemaLabels = {
  rfc2307: 'RFC2307',
} as const;

function realmRowTag(realm: string): string {
  return kebabTestSegment(`kerberos-realm-${realm}`.toLowerCase());
}

function keytabRowTag(name: string): string {
  return kebabTestSegment(`kerberos-keytab-${name}`.toLowerCase());
}

export const directoryServicesLocators = {
  /**
   * The `tn-empty` shown while no directory service is enabled, tagged on its
   * host. Its title is "Directory services are disabled."
   */
  disabled: '[data-test="text-directory-services-disabled"]',

  /** "Configure Directory Services", under the disabled state. The id predates its label. */
  configure: '[data-test="button-configure-active-directory"]',

  configForm: {
    serviceType: '[data-test="select-service-type"]',
    serviceTypeOption: (label: string): string => `[data-test="option-service-type-${kebabTestSegment(label)}"]`,
    enable: '[data-test="checkbox-enable"]',
    timeout: '[data-test="input-timeout"]',
    /** The `tn-form-field` around Timeout, which holds its validation error. */
    timeoutField: '[data-test="form-field-timeout"]',

    credentialType: '[data-test="select-credential-type"]',
    credentialTypeOption: (label: string): string => (
      `[data-test="option-credential-type-${kebabTestSegment(label)}"]`
    ),
    /** Kerberos Principal only. */
    principal: '[data-test="select-principal"]',
    /** Kerberos User only. */
    username: '[data-test="input-username"]',
    password: '[data-test="input-password"]',
    /** LDAP Plain only. */
    bindDn: '[data-test="input-binddn"]',
    bindPassword: '[data-test="input-bindpw"]',

    /** Active Directory. Hostname and Domain are rendered by IPA too, under the same ids. */
    activeDirectory: {
      hostname: '[data-test="input-hostname"]',
      domain: '[data-test="input-domain"]',
      site: '[data-test="input-site"]',
      computerAccountOu: '[data-test="input-computer-account-ou"]',
      useDefaultDomain: '[data-test="checkbox-use-default-domain"]',
    },

    /** Active Directory's IDMAP section. Everything but the checkbox is hidden while it is ticked. */
    idmap: {
      useDefaults: '[data-test="checkbox-use-default-idmap"]',
      builtinName: '[data-test="input-builtin-name"]',
      builtinRangeLow: '[data-test="input-builtin-range-low"]',
      builtinRangeHigh: '[data-test="input-builtin-range-high"]',
      backend: '[data-test="select-idmap-backend"]',
      backendOption: (label: string): string => `[data-test="option-idmap-backend-${kebabTestSegment(label)}"]`,
      name: '[data-test="input-name"]',
      rangeLow: '[data-test="input-range-low"]',
      rangeHigh: '[data-test="input-range-high"]',
      /** AD backend only. */
      schemaMode: '[data-test="select-schema-mode"]',
      unixPrimaryGroup: '[data-test="checkbox-unix-primary-group"]',
      unixNssInfo: '[data-test="checkbox-unix-nss-info"]',
      /** RFC2307 and LDAP backends. */
      ldapUrl: '[data-test="input-ldap-url"]',
      ldapUserDn: '[data-test="input-ldap-user-dn"]',
      ldapUserDnPassword: '[data-test="input-ldap-user-dn-password"]',
      /** RFC2307 backend only. */
      bindPathUser: '[data-test="input-bind-path-user"]',
      bindPathGroup: '[data-test="input-bind-path-group"]',
      /** RID backend only. */
      sssdCompat: '[data-test="checkbox-sssd-compat"]',
    },

    ldap: {
      /** `tn-chip-input testId="server_urls"`: the typable field; Enter commits the text as a chip. */
      serverUrls: '[data-test="chip-input-server-urls"]',
      /** IPA renders one under the same id. */
      baseDn: '[data-test="input-basedn"]',
      startTls: '[data-test="checkbox-starttls"]',
      /** IPA renders one under the same id. */
      validateCertificates: '[data-test="checkbox-validate-certificates"]',
      schema: '[data-test="select-schema"]',
      schemaOption: (label: string): string => `[data-test="option-schema-${kebabTestSegment(label)}"]`,
      useStandardSearchBases: '[data-test="checkbox-use-standard-search-bases"]',
      baseUser: '[data-test="input-base-user"]',
      baseGroup: '[data-test="input-base-group"]',
      baseNetgroup: '[data-test="input-base-netgroup"]',
    },

    ipa: {
      targetServer: '[data-test="input-target-server"]',
      useDefaultSmbDomain: '[data-test="checkbox-use-default-smb-domain"]',
      smbDomainName: '[data-test="input-smb-domain-name"]',
      smbDomainDomainName: '[data-test="input-smb-domain-domain-name"]',
      smbDomainRangeLow: '[data-test="input-smb-domain-range-low"]',
      smbDomainRangeHigh: '[data-test="input-smb-domain-range-high"]',
      smbDomainSid: '[data-test="input-smb-domain-domain-sid"]',
    },

    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
    closePanel: '[data-test="button-close-side-panel"]',
  },

  /**
   * `<tn-button [testId]="'show-advanced-settings'">`. Pressing it opens the
   * panel and raises webui's shared confirm with `hideCheckbox: true`; cancelling
   * that closes the panel again.
   */
  showAdvancedSettings: '[data-test="button-show-advanced-settings"]',

  realms: {
    /** `<tn-button [testId]="'add-kerberos-realms'">` in the card footer. */
    add: '[data-test="button-add-kerberos-realms"]',

    row: (realm: string): string => `[data-test="row-${realmRowTag(realm)}"]`,

    realm: (realm: string): string => `[data-test="text-realm-${realmRowTag(realm)}-row-text"]`,

    /** The KDC list, joined with `, `. */
    kdc: (realm: string): string => `[data-test="text-kdc-${realmRowTag(realm)}-row-text"]`,

    /** The admin server list, joined with `, `. */
    adminServer: (realm: string): string => `[data-test="text-admin-server-${realmRowTag(realm)}-row-text"]`,

    /** The password server list, joined with `, `. */
    passwordServer: (realm: string): string => (
      `[data-test="text-password-server-${realmRowTag(realm)}-row-text"]`
    ),

    /** The row's own Edit button — the row tag, the icon, library and all, then `row-action`. */
    edit: (realm: string): string => `[data-test="button-${realmRowTag(realm)}-mdi-pencil-row-action"]`,

    /** The row's own Delete button. Same shape as {@link edit}. */
    delete: (realm: string): string => `[data-test="button-${realmRowTag(realm)}-mdi-delete-row-action"]`,
  },

  realmForm: {
    realm: '[data-test="input-realm"]',
    primaryKdc: '[data-test="input-primary-kdc"]',
    /** `tn-chip-input testId="kdc"`: the typable field; Enter commits the text as a chip. */
    kdc: '[data-test="chip-input-kdc"]',
    /** Same shape as {@link kdc}. */
    adminServer: '[data-test="chip-input-admin-server"]',
    /** Same shape as {@link kdc}. */
    passwordServer: '[data-test="chip-input-kpasswd-server"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },

  keytabs: {
    /** `<tn-button [testId]="'add-kerberos-keytabs'">` in the card footer. */
    add: '[data-test="button-add-kerberos-keytabs"]',

    row: (name: string): string => `[data-test="row-${keytabRowTag(name)}"]`,

    name: (name: string): string => `[data-test="text-name-${keytabRowTag(name)}-row-text"]`,

    /** The row's own Delete button — the row tag, the icon, library and all, then `row-action`. */
    delete: (name: string): string => `[data-test="button-${keytabRowTag(name)}-mdi-delete-row-action"]`,
  },

  keytabForm: {
    name: '[data-test="input-name"]',
    /**
     * The `tn-file-input` host, pinned to the legacy `input-file` id at the call
     * site. The id is on the host, not on the native `<input type="file">` inside
     * it, and the Choose File button inside carries none of its own.
     */
    file: '[data-test="input-file"]',
    save: '[data-test="button-save"]',
  },
} as const;
