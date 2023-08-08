# coding=utf-8
"""High Availability (tn-bhyve06) feature tests."""

import reusableSeleniumCode as rsc
import time
import xpaths
from function import (
    wait_on_element,
    attribute_value_exist,
    wait_on_element_disappear
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends


@scenario('features/NAS-T958.feature', 'Change user home directory permissions')
def test_change_user_home_directory_permissions(driver):
    """Change user home directory permissions."""
    pass


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url, request):
    """The browser is open navigate to "{nas_url}"."""
    depends(request, ['First_User'], scope='session')
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        time.sleep(1)


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_root_and_password(driver, user, password):
    """If login page appear enter "{user}" and "{password}"."""
    rsc.Login_If_Not_On_Dashboard(driver, user, password)


@then('You should see the dashboard')
def you_should_see_the_dashboard(driver):
    """You should see the dashboard."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)


@then('Click on the Credentials item in the left side menu')
def click_on_the_credentials_item_in_the_left_side_menu(driver):
    """Click on the Credentials item in the left side menu."""
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()


@then('The Credentials menu should expand to the right')
def the_credentials_menu_should_expand_to_the_right(driver):
    """The Credentials menu should expand to the right."""
    assert wait_on_element(driver, 7, xpaths.side_Menu.local_User, 'clickable')


@then('Click on Local Users')
def click_on_localusers(driver):
    """Click on Local Users."""
    driver.find_element_by_xpath(xpaths.side_Menu.local_User).click()


@then('The Users page should open')
def the_users_page_should_open(driver):
    """The Users page should open."""
    assert wait_on_element(driver, 7, xpaths.users.title)


@then('On the right side of the table, click the expand arrow for one of the users')
def on_the_right_side_of_the_table_click_the_expand_arrow_for_one_of_the_users(driver):
    """On the right side of the table, click the expand arrow for one of the users."""
    assert wait_on_element(driver, 7, xpaths.users.eric_User)
    driver.find_element_by_xpath(xpaths.users.eric_User).click()


@then('The User Field should expand down to list further details')
def the_user_field_should_expand_down_to_list_further_details(driver):
    """The User Field should expand down to list further details."""
    assert wait_on_element(driver, 7, xpaths.users.eric_Edit_Button, 'clickable')


@then('Click the Edit button that appears')
def click_the_edit_button_that_appears(driver):
    """Click the Edit button that appears."""
    driver.find_element_by_xpath(xpaths.users.eric_Edit_Button).click()


@then('The User Edit Page should open')
def the_user_edit_page_should_open(driver):
    """The User Edit Page should open."""
    assert wait_on_element(driver, 7, xpaths.add_User.edit_Title)
    time.sleep(1)


@then('Change the permissions for the Users Home Directory (invert them) and click save')
def change_the_permissions_for_the_users_home_directory_invert_them_and_click_save(driver):
    """Change the permissions for the Users Home Directory (invert them) and click save."""
    assert wait_on_element(driver, 7, '//span[text()="Home Directory Permissions"]')
    assert wait_on_element(driver, 2, xpaths.add_User.home_Mode_Group_Write_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.add_User.home_Mode_Group_Write_Checkbox).click()
    driver.find_element_by_xpath(xpaths.add_User.home_Mode_Group_Exec_Checkbox).click()
    driver.find_element_by_xpath(xpaths.add_User.home_Mode_Other_Write_Checkbox).click()
    driver.find_element_by_xpath(xpaths.add_User.home_Mode_Other_Exec_Checkbox).click()
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()

    rsc.Confirm_Warning(driver)


@then('Change should be saved')
def change_should_be_saved(driver):
    """Change should be saved."""
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_User)


@then('Reopen the user edit page and ensure that the additional Aux Group was saved')
def reopen_the_user_edit_page_and_ensure_that_the_additional_aux_group_was_saved(driver):
    """Reopen the user edit page and ensure that the additional Aux Group was saved."""
    assert wait_on_element(driver, 7, xpaths.users.eric_User, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_User).click()
    assert wait_on_element(driver, 5, xpaths.users.eric_Edit_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_Edit_Button).click()
    assert wait_on_element(driver, 5, xpaths.add_User.edit_Title)
    assert wait_on_element(driver, 5, xpaths.add_User.identification_Legend)
    time.sleep(1)


@then('The changed permissions should be what they were changed to')
def the_changed_permissions_should_be_what_they_were_changed_to(driver):
    """The changed permissions should be what they were changed to."""
    assert wait_on_element(driver, 7, '//span[text()="Home Directory Permissions"]')
    assert wait_on_element(driver, 2, xpaths.add_User.home_Mode_Group_Write_Checkbox)
    assert attribute_value_exist(driver, xpaths.add_User.home_Mode_Owner_Write_Checkbox, 'class', 'mat-mdc-checkbox-checked')
    assert attribute_value_exist(driver, xpaths.add_User.home_Mode_Owner_Read_Checkbox, 'class', 'mat-mdc-checkbox-checked')
    assert attribute_value_exist(driver, xpaths.add_User.home_Mode_Owner_Exec_Checkbox, 'class', 'mat-mdc-checkbox-checked')
    assert attribute_value_exist(driver, xpaths.add_User.home_Mode_Group_Read_Checkbox, 'class', 'mat-mdc-checkbox-checked') is False
    assert attribute_value_exist(driver, xpaths.add_User.home_Mode_Group_Write_Checkbox, 'class', 'mat-mdc-checkbox-checked')
    assert attribute_value_exist(driver, xpaths.add_User.home_Mode_Group_Exec_Checkbox, 'class', 'mat-mdc-checkbox-checked')
    assert attribute_value_exist(driver, xpaths.add_User.home_Mode_Other_Read_Checkbox, 'class', 'mat-mdc-checkbox-checked') is False
    assert attribute_value_exist(driver, xpaths.add_User.home_Mode_Other_Write_Checkbox, 'class', 'mat-mdc-checkbox-checked')
    assert attribute_value_exist(driver, xpaths.add_User.home_Mode_Other_Exec_Checkbox, 'class', 'mat-mdc-checkbox-checked')
    # setting back the original permission for future test
    assert wait_on_element(driver, 2, xpaths.add_User.home_Mode_Group_Write_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.add_User.home_Mode_Group_Write_Checkbox).click()
    driver.find_element_by_xpath(xpaths.add_User.home_Mode_Group_Exec_Checkbox).click()
    driver.find_element_by_xpath(xpaths.add_User.home_Mode_Other_Write_Checkbox).click()
    driver.find_element_by_xpath(xpaths.add_User.home_Mode_Other_Exec_Checkbox).click()

    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()

    rsc.Confirm_Warning(driver)

    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 5, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_User)
