import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';

export const minDisksPerLayout = {
  [CreateVdevLayout.Stripe]: 1,
  [CreateVdevLayout.Mirror]: 2,
  [CreateVdevLayout.Raidz1]: 3,
  [CreateVdevLayout.Raidz2]: 4,
  [CreateVdevLayout.Raidz3]: 5,
};
