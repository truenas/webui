import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';

export const minDisksPerLayout = {
  [CreateVdevLayout.Stripe]: 1,
  [CreateVdevLayout.Mirror]: 2,
  [CreateVdevLayout.Raidz1]: 3,
  [CreateVdevLayout.Raidz2]: 4,
  [CreateVdevLayout.Raidz3]: 5,
  [CreateVdevLayout.Draid1]: 2,
  [CreateVdevLayout.Draid2]: 3,
  [CreateVdevLayout.Draid3]: 4,
};
