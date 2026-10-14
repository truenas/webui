/**
 * Alert class settings: the Category card on System > Alert Settings, over the API.
 *
 * Every class's level and frequency is one config record, `alertclasses.config`,
 * whose `classes` holds an entry only for a class that differs from its default.
 * `alertclasses.update` replaces that map whole, and so does the card: it sends
 * every override the form holds, not just the one that changed. So an override
 * the test did not touch surviving a save is something the UI did, not
 * something middleware kept for it.
 *
 * Which classes exist, and what they are called, is middleware's to say and
 * moves between releases. So the spec does not name one: {@link pickAlertClasses}
 * reads `alert.list_categories` and takes two from the same category.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { kebabTestSegment } from '../locators/test-id';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs } from '../support/timeouts';

type AlertCategoryEntry = CallResponse<E2eApiDirectory, 'alert.list_categories'>[number];

/** Every class override the appliance holds, keyed by class id. A class with none is at its default. */
export type AlertClassOverrides = CallResponse<E2eApiDirectory, 'alertclasses.config'>['classes'];

export type AlertClassOverride = AlertClassOverrides[string];

export interface AlertClassPick {
  categoryId: string;
  categoryTitle: string;
  id: string;
  title: string;
  /** The level the class has with no override, e.g. `WARNING`. */
  defaultLevel: string;
}

/** Every class override as the appliance holds it. */
export async function readAlertClassOverrides(client: E2eApiClient): Promise<AlertClassOverrides> {
  const config = await firstValueFrom(client.api.call('alertclasses.config').pipe(timeout(readTimeoutMs)));
  return config.classes;
}

/** One class's override, or undefined when the class is at its default. */
export async function readAlertClassOverride(
  client: E2eApiClient,
  classId: string,
): Promise<AlertClassOverride | undefined> {
  const overrides: Partial<AlertClassOverrides> = await readAlertClassOverrides(client);
  return overrides[classId];
}

/** `overrides` without any entry for these classes, which puts them back at their defaults. */
export function withoutOverrides(overrides: AlertClassOverrides, classIds: string[]): AlertClassOverrides {
  return Object.fromEntries(Object.entries(overrides).filter(([id]) => !classIds.includes(id)));
}

/**
 * Replaces every class override. Used for the state a test starts from and for
 * teardown — never for the change under test, which goes through the card.
 */
export async function setAlertClassOverrides(client: E2eApiClient, classes: AlertClassOverrides): Promise<void> {
  await firstValueFrom(client.api.call('alertclasses.update', [{ classes }]).pipe(timeout(readTimeoutMs)));
}

/**
 * Two classes from one category: the one a test changes, and a bystander whose
 * override must survive the save.
 *
 * Not the first category, which the card opens on — so reaching the class goes
 * through the category menu. Each title has to normalize to an id no other class
 * in the category shares, or its row could not be addressed on its own.
 */
export async function pickAlertClasses(
  client: E2eApiClient,
): Promise<{ target: AlertClassPick; bystander: AlertClassPick }> {
  const categories = await firstValueFrom(
    client.api.call('alert.list_categories').pipe(timeout(readTimeoutMs)),
  );

  for (const category of categories.slice(1)) {
    const [target, bystander] = addressableClasses(category);
    if (target && bystander) {
      return { target, bystander };
    }
  }

  throw new Error('No category after the first has two classes with distinct titles to test with.');
}

function addressableClasses(category: AlertCategoryEntry): AlertClassPick[] {
  const counts = new Map<string, number>();
  for (const cls of category.classes) {
    const key = kebabTestSegment(cls.title);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return category.classes
    .filter((cls) => counts.get(kebabTestSegment(cls.title)) === 1)
    .map((cls) => ({
      categoryId: category.id,
      categoryTitle: category.title,
      id: cls.id,
      title: cls.title,
      defaultLevel: cls.level,
    }));
}
