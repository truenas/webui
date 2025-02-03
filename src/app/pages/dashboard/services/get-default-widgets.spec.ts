import { getDefaultWidgets } from 'app/pages/dashboard/services/get-default-widgets';
import { WidgetGroup } from 'app/pages/dashboard/types/widget-group.interface';
import { WidgetType } from 'app/pages/dashboard/types/widget.interface';

describe('getDefaultWidgets', () => {
  it('should return all default widgets when isHaLicensed is true', () => {
    const result: WidgetGroup[] = getDefaultWidgets(true);

    expect(result).toHaveLength(9);
    expect(result[0].slots[0]!.type).toBe(WidgetType.SystemInfoActive);
    expect(result[1].slots[0]!.type).toBe(WidgetType.SystemInfoPassive);
  });

  it('should return default widgets without the second widget when isHaLicensed is false', () => {
    const result: WidgetGroup[] = getDefaultWidgets(false);

    expect(result).toHaveLength(8);
    expect(result[0].slots[0]!.type).toBe(WidgetType.SystemInfoActive);
  });
});
