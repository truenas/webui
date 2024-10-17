# How to create a widget

1. Add a type to `WidgetType`.
2. Create new component under `widgets` in an appropriate category.
3. If your widget has custom settings in the edit form, create a component for them as well (see `WidgetSettingsComponent`).
4. Write widget definition with `dashboardWidget()`
5. Connect widget definition to `widgetRegistry`.

## Guidelines for widgets
### Fluid
* You can use `size` property to adjust widget layout based on slot size.
* However, do not rely on strict pixel sizes because they will change on mobile. 

### Loading indicators
* Prefer subtle skeletons.

### Real-time
* Widgets should rely on subscriptions when possible.
* But do not do polling.
* Prefer `subscribe` and `callAndSubscribe` when possible. 

### Fast
* Widgets should show data as it's coming in.
* Instead of showing a large loading indicator, show partial data and skeletons.

### Share data
* Widgets should avoid querying websockets in them. 
* Instead, they should use `WidgetResourcesService`.
* Responses should be shared with `shareReplay`.

### Encapsulated
* Widget folder should contain most things related to the widget.
* Widgets should handle their own data processing.
* If a lot of processing required, create a service inside the widget folder.
* Prefer inline errors, but you can use WidgetErrorComponent for fatal errors.

## Widget Migrations
Because widgets are stored in user attributes, it's possible to end up in a situation where a system was updated and previously available widget is no longer there.

Try to write migrations in `DashboardStore` when removing or editing a `WidgetType`.

When migration is not possible, still show the widget, but with a message that it's no longer available. 
