/**
 * Stories: an admin edits an iSCSI target and an authorized access entry, and
 * deletes initiator groups, from the full iSCSI page, and the appliance holds
 * what they did.
 *
 * Each edit or delete runs beside a second record of the same kind that must
 * come through untouched, and everything is read back through the `iscsi.*`
 * queries. Every value an edit sets differs from both the form's default and
 * middleware's: an alias, a network, CHAP on a group with an auth tag, and a
 * new secret.
 *
 * Deleting an initiator group a target still uses is not refused: middleware's
 * `iscsi.initiator.delete` checks nothing, and the target group's reference to
 * it is `ON DELETE SET NULL`, so the target keeps its group with no initiator
 * group in it. That is read from middleware's source, and the test pins it.
 *
 * The iSCSI service is never started.
 */
import {
  ensureIscsiInitiatorPresent, ensureIscsiPortalPresent, ensureIscsiServiceStopped, ensureIscsiShareAbsent,
  ensureIscsiTargetPresent, findIscsiTarget,
} from '../fixtures/iscsi';
import {
  ensureIscsiAuthorizedAccessAbsent, ensureIscsiAuthorizedAccessPresent, ensureIscsiInitiatorGroupPresent,
  ensureIscsiInitiatorGroupsAbsent, findIscsiAuthorizedAccess, findIscsiInitiatorGroup,
} from '../fixtures/iscsi-config';
import { editIscsiTarget, openIscsiTargetForEdit } from '../flows/iscsi';
import {
  changeIscsiAuthorizedAccessToChap, deleteIscsiInitiatorGroup, openIscsiAuthorizedAccessForEdit,
} from '../flows/iscsi-config';
import { iscsiLocators } from '../locators/iscsi';
import { iscsiConfigLocators } from '../locators/iscsi-config';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps, type CleanupStep } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The `comment` on the portal and the allow-all initiator group the targets' groups point at. */
const groupComment = 'e2e-iscsi-edit-group';

/** Target names: lowercase, digits, dot, dash and colon only. */
const editedTarget = 'e2e-iscsi-edit-target';
const bystanderTarget = 'e2e-iscsi-edit-bystander';
const inUseTarget = 'e2e-iscsi-edit-in-use';
const allTargets = [editedTarget, bystanderTarget, inUseTarget];

/** The auth tag a target group's CHAP is pointed at, and the entry that makes it exist. */
const chapTag = 104;
const chapTagUser = 'e2e-chap-edit-group';

/** The entry an edit moves from Mutual CHAP to CHAP, and the one beside it. */
const editedChapUser = 'e2e-chap-edited';
const editedChapPeer = 'e2e-chap-edited-peer';
const bystanderChapUser = 'e2e-chap-edit-bystander';
const allChapUsers = [chapTagUser, editedChapUser, bystanderChapUser];

/** Initiator group comments. */
const deletedInitiators = 'e2e-initiators-deleted';
const bystanderInitiators = 'e2e-initiators-bystander';
const inUseInitiators = 'e2e-initiators-in-use';
const allInitiatorComments = [deletedInitiators, bystanderInitiators, inUseInitiators];

const iqnA = 'iqn.2005-10.org.example.e2e:edit-a';
const iqnB = 'iqn.2005-10.org.example.e2e:edit-b';

/**
 * Targets first, since middleware refuses to delete the last entry of an auth
 * tag a target still uses. Then the auth entries, then the initiator groups and
 * the portal. `ensureIscsiShareAbsent` removes a target by name, and the portal
 * and initiator group labelled with the name it is given.
 */
async function removeEverything(api: E2eApiClient): Promise<void> {
  const steps: CleanupStep[] = [
    ...allTargets.map((name): CleanupStep => [
      `remove the iSCSI target ${name}`,
      () => ensureIscsiShareAbsent(api, name),
    ]),
    ...allChapUsers.map((user): CleanupStep => [
      `remove the iSCSI authorized access for ${user}`,
      () => ensureIscsiAuthorizedAccessAbsent(api, user),
    ]),
    ...allInitiatorComments.map((comment): CleanupStep => [
      `remove the iSCSI initiator group ${comment}`,
      () => ensureIscsiInitiatorGroupsAbsent(api, comment),
    ]),
    [`remove the portal and initiator group "${groupComment}"`, () => ensureIscsiShareAbsent(api, groupComment)],
    ['stop the iSCSI service', () => ensureIscsiServiceStopped(api)],
  ];
  await runCleanupSteps(steps);
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the next one able to start.
 *
 * The `pool` fixture is asked for, though nothing here is stored under it: the Shares dashboard
 * renders its cards only when a pool exists, and the iSCSI card is where the full page is opened from.
 */
test.beforeEach(async ({ api, pool }) => {
  test.info().annotations.push({ type: 'pool', description: pool });
  await removeEverything(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the iSCSI targets, authorized access entries, initiator groups and portal named e2e-*')) {
    return;
  }

  await removeEverything(api);
});

test.describe('the target form', () => {
  /** The edited target's group points at both of these, and starts with no authentication. */
  async function provisionEditedTarget(
    api: E2eApiClient,
  ): Promise<{ target: number; portal: number; initiator: number }> {
    const portal = await ensureIscsiPortalPresent(api, groupComment);
    const initiator = await ensureIscsiInitiatorPresent(api, groupComment);
    const target = await ensureIscsiTargetPresent(api, editedTarget, {
      alias: 'Before',
      auth_networks: ['10.20.30.0/24'],
      groups: [{
        portal: portal.id,
        initiator: initiator.id,
        authmethod: 'NONE',
        auth: null,
      }],
    });
    await ensureIscsiTargetPresent(api, bystanderTarget, { alias: 'Left alone' });

    return { target: target.id, portal: portal.id, initiator: initiator.id };
  }

  test('an admin edits the alias, the authorized network and the group authentication of a target', async ({
    page, api,
  }) => {
    // Middleware accepts CHAP on a group whatever the tag's discovery setting; only Mutual CHAP needs a peer.
    await ensureIscsiAuthorizedAccessPresent(api, { tag: chapTag, user: chapTagUser, secret: 'e2eGroupSecret' });
    const { target, portal, initiator } = await provisionEditedTarget(api);

    await editIscsiTarget(page, {
      name: editedTarget,
      alias: 'After',
      networkAddress: '10.20.40.0',
      chapAuthTag: chapTag,
    });

    const { targets } = iscsiLocators;
    await expect(page.locator(targets.detailsFor)).toHaveText(`Details for ${editedTarget}`);
    await expect(page.locator(targets.authorizedNetwork(0))).toHaveText('10.20.40.0/24');
    await expect(page.locator(targets.authenticationMethod(0))).toHaveText('CHAP');
    await expect(page.locator(targets.authenticationGroupNumber(0))).toHaveText(String(chapTag));
    await expect(page.locator(targets.alias(editedTarget))).toHaveText('After');

    // The same target, not a new one, with the prefix length it had.
    expect(await findIscsiTarget(api, editedTarget)).toMatchObject({
      id: target,
      alias: 'After',
      auth_networks: ['10.20.40.0/24'],
      groups: [{
        portal,
        initiator,
        authmethod: 'CHAP',
        auth: chapTag,
      }],
    });
    expect(await findIscsiTarget(api, bystanderTarget)).toMatchObject({ alias: 'Left alone', groups: [] });
  });

  test('the target form refuses a name another target already has', async ({ page, api }) => {
    await provisionEditedTarget(api);
    const { targetForm } = iscsiLocators;

    await openIscsiTargetForEdit(page, editedTarget);
    await page.locator(targetForm.name).fill(bystanderTarget);

    // `iscsi.target.validate_name`'s own message, which the form shows as it is.
    await expect(page.locator(targetForm.nameField)).toContainText('Target with this name already exists');
    await expect(page.locator(targetForm.save)).toBeDisabled();

    // A submit attempt, so the read-back below would catch a form that saved anyway.
    await page.locator(targetForm.name).press('Enter');
    expect(await findIscsiTarget(api, editedTarget)).toMatchObject({ alias: 'Before' });
    expect(await findIscsiTarget(api, bystanderTarget)).toMatchObject({ alias: 'Left alone' });
  });
});

test('an admin changes an authorized access entry from Mutual CHAP to CHAP with a new secret', async ({
  page, api,
}) => {
  const newSecret = 'e2eNewSecret12';
  const edited = await ensureIscsiAuthorizedAccessPresent(api, {
    tag: 105,
    user: editedChapUser,
    secret: 'e2eOldSecret01',
    peer: { peeruser: editedChapPeer, peersecret: 'e2ePeerSecret9' },
  });
  const bystander = await ensureIscsiAuthorizedAccessPresent(api, {
    tag: 106,
    user: bystanderChapUser,
    secret: 'e2eKeepSecret2',
  });
  const { authorizedAccess, authorizedAccessForm: form } = iscsiConfigLocators;

  await openIscsiAuthorizedAccessForEdit(page, editedChapUser, editedChapPeer);

  // Eleven characters, one short, and matched by the confirmation so length is the only complaint.
  await page.locator(form.secret).fill('e2eShort011');
  await page.locator(form.secretConfirm).fill('e2eShort011');
  await expect(page.locator(form.secretField)).toContainText('The length of the field should be at least 12');
  await expect(page.locator(form.save)).toBeDisabled();

  await changeIscsiAuthorizedAccessToChap(page, { user: editedChapUser, secret: newSecret });

  // The row is keyed by the peer user too, so dropping the peer moves it to a new id.
  await expect(page.locator(authorizedAccess.row(editedChapUser, '').row)).toBeVisible();
  await expect(page.locator(authorizedAccess.row(editedChapUser, editedChapPeer).row)).toBeHidden();

  expect(await findIscsiAuthorizedAccess(api, editedChapUser)).toMatchObject({
    id: edited.id,
    secret: newSecret,
    discovery_auth: 'CHAP',
    peeruser: '',
    peersecret: '',
  });
  expect(await findIscsiAuthorizedAccess(api, bystanderChapUser)).toMatchObject({
    id: bystander.id,
    secret: 'e2eKeepSecret2',
    discovery_auth: 'NONE',
  });
});

test.describe('deleting an initiator group', () => {
  test('an admin deletes an initiator group, and only that one', async ({ page, api }) => {
    const deleted = await ensureIscsiInitiatorGroupPresent(api, { comment: deletedInitiators, initiators: [iqnA] });
    const bystander = await ensureIscsiInitiatorGroupPresent(api, {
      comment: bystanderInitiators,
      initiators: [iqnB],
    });

    // Ticks the confirmation first, and checks Delete is disabled until it is ticked.
    await deleteIscsiInitiatorGroup(page, deleted.id);

    // Polled: the row can also be hidden while the list reloads, which proves nothing.
    await expect.poll(() => findIscsiInitiatorGroup(api, deleted.id)).toBeUndefined();
    expect(await findIscsiInitiatorGroup(api, bystander.id)).toMatchObject({
      comment: bystanderInitiators,
      initiators: [iqnB],
    });
    await expect(page.locator(iscsiConfigLocators.initiators.row(bystander.id).row)).toBeVisible();
  });

  test('deleting an initiator group a target uses keeps the target group, without an initiator group', async ({
    page, api,
  }) => {
    const portal = await ensureIscsiPortalPresent(api, groupComment);
    const inUse = await ensureIscsiInitiatorGroupPresent(api, { comment: inUseInitiators, initiators: [iqnA] });
    const target = await ensureIscsiTargetPresent(api, inUseTarget, {
      groups: [{
        portal: portal.id,
        initiator: inUse.id,
        authmethod: 'NONE',
        auth: null,
      }],
    });

    await deleteIscsiInitiatorGroup(page, inUse.id);

    await expect.poll(() => findIscsiInitiatorGroup(api, inUse.id)).toBeUndefined();
    // Not refused, and the group is not dropped: only its initiator group goes.
    expect(await findIscsiTarget(api, inUseTarget)).toMatchObject({
      id: target.id,
      groups: [{ portal: portal.id, initiator: null }],
    });
  });
});
