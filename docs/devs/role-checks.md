# Role Checks

TrueNAS allows users to create admins with custom roles.

### Readonly role is the minimum
Readonly role is assumed to be the bare minimum role required to access the WebUI.\
That means that most of the time there are no checks for `*_READ` roles.

The only exception to this are areas showing potentially sensitive information.

### Restricting Elements

Elements that user doesn't have access to are shown, but are disabled with lock icon:

```html
<button
  *ixRequiresRoles="requiredRoles"
></button>
```

`ixRequiresRoles` uses `OR` logic.

Most of the time, it's best to see API docs for specific role required to make the call and use it in the role check.\
Most of the time, you don't need to check for `FULL_ADMIN` role.

When `*ixRequiresRoles` cannot be used, element is disabled in other ways and a `matTooltip` is added.

#### Restricted Forms

Whether a restricted slide-in form can be opened depends on whether information in the form is available elsewhere or not:

* If all form information is available elsewhere, the button to open the form is restricted.
* If form shows values not shown elsewhere, form can be opened, but Save button is restricted and form has the `readonly` mark.

`readonly` mark can be added with:
```
<ix-modal-header
  [requiredRoles]="requiredRoles"
></ix-modal-header>
```


#### Tests
You can use `mockAuth()` provider to mock a `FULL_ADMIN` role in tests.