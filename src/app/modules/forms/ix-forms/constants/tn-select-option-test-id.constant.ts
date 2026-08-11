import { TnSelectOption } from '@truenas/ui-components';
import { normalizeTestIdString } from 'app/modules/test-id/normalize-test-id.utils';

/**
 * The ready-made `optionTestIdKey` callback for `tn-select` / `tn-autocomplete`.
 *
 * With no key, the library's `optionTestId()` derives an option's id from its **value** when that
 * value is a `string` or a `number`, and falls back to the **label** for anything else. The legacy
 * `[ixTest]="[name, option.label]"` always derived it from the label, so a select whose label and
 * value differ *and* whose value is a primitive — a keychain credential name vs its numeric id, an
 * `RsyncSshConnectMode` caption vs its enum ordinal, `Plain (No Encryption)` vs `PLAIN` — silently
 * renames every option id on migration unless the key is pinned back to the label. Object- or
 * array-valued options (`{ size, type }`) already land on the label unaided, but pin the key there
 * too: it costs nothing and states the derivation in the template instead of leaving it to a
 * library default that only holds while the value stays non-primitive.
 *
 * The label is normalized with {@link normalizeTestIdString} (lodash `kebabCase`) rather than handed
 * over raw, because the library's own normalizer is not the one `[ixTest]` used: it neither drops an
 * apostrophe outright nor splits a letter→digit boundary. Raw, `SSH private key stored in user's
 * home directory` resolves to `…in-user-s-home-directory` and `RAIDZ1` to `raidz1`, where Release
 * Engineering selects on `…in-users-home-directory` and `raidz-1`. Pre-normalizing produces a value
 * the library's normalizer then passes through unchanged, so the ids stay byte-identical to the ones
 * the legacy directive resolved. See NAS-141021, NAS-142127.
 *
 * Kept here, alongside `tn-select-labels.constant.ts`, so the reasoning is pinned in one place
 * instead of being re-derived per component. Pass it straight through:
 * `[optionTestIdKey]="optionTestIdByLabel"`.
 *
 * A select whose id has to come from somewhere other than the label — a lookup keyed by the
 * option value, say — still needs its own callback; see `app-update-dialog.component.ts`.
 *
 * The callback is generic in the option value on purpose: a concrete `TnSelectOption<unknown>`
 * parameter would pin the host `tn-select<T>`'s own type argument to `unknown`, breaking the
 * inference its other bindings depend on (`(multiSelectionChange)` handlers, `compareWith`).
 *
 * **Sharp edge:** a label-derived id is locale-dependent — the option ids shift with the active
 * language, so a test pinned to `option-pool-my-pool` in English will not resolve under another
 * locale. Legacy `[ixTest]="[name, option.label]"` had exactly the same property, so pinning the
 * key is parity-preserving rather than a new hazard; but where an id must be stable across
 * languages, key off a locale-independent field of the option value instead.
 */
export const optionTestIdByLabel = <T>(option: TnSelectOption<T>): string => normalizeTestIdString(option.label);
