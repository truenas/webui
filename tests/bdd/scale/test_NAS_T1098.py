# coding=utf-8
"""SCALE UI: feature tests."""

import time
import xpaths
import reusableSeleniumCode as rsc
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
from pytest_dependency import depends


@scenario('features/NAS-T1098.feature', 'Change the permissions of a user home directory')
def test_change_the_permissions_of_a_user_home_directory():
    """Change the permissions of a user home directory."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['First_User', 'First_User_Home'], scope='session')
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
    if not is_element_present(driver, xpaths.side_Menu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
        driver.find_element_by_xpath(xpaths.login.user_Input).clear()
        driver.find_element_by_xpath(xpaths.login.user_Input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_Button)
        driver.find_element_by_xpath(xpaths.login.signin_Button).click()
    else:
        assert wait_on_element(driver, 10, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()


@when('on the dashboard, click on the Accounts on the side menu, click on Users')
def on_the_dashboard_click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """on the dashboard, click on the Accounts on the side menu, click on Users."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 10, xpaths.side_Menu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.side_Menu.local_User, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.local_User).click()


@when('the Users page should open, click the Greater-Than-Sign right of the users')
def the_users_page_should_open_click_the_greaterthansign_right_of_the_users(driver):
    """the Users page should open, click the Greater-Than-Sign right of the users."""
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_User, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_User).click()


@then('the User Field should expand down, click the Edit button')
def the_user_field_should_expand_down_click_the_edit_button(driver):
    """the User Field should expand down, click the Edit button."""
    assert wait_on_element(driver, 10, xpaths.users.eric_Edit_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_Edit_Button).click()


@then('the User Edit Page should open, change some permissions for the Home Directory and click save')
def the_user_edit_page_should_open_change_some_permissions_for_the_home_directory_and_click_save(driver):
    """the User Edit Page should open, change some permissions for the Home Directory and click save."""
    assert wait_on_element(driver, 10, xpaths.add_User.edit_Title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)
    time.sleep(1)
    assert wait_on_element(driver, 2, xpaths.add_User.home_Mode_Group_Write_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.add_User.home_Mode_Group_Write_Checkbox).click()
    driver.find_element_by_xpath(xpaths.add_User.home_Mode_Group_Exec_Checkbox).click()
    driver.find_element_by_xpath(xpaths.add_User.home_Mode_Other_Write_Checkbox).click()
    driver.find_element_by_xpath(xpaths.add_User.home_Mode_Other_Exec_Checkbox).click()
    time.sleep(0.5)
    wait_on_element(driver, 10, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()

    rsc.Confirm_Warning(driver)


@then('reopen the user edit page and verify all permissions are save properly')
def reopen_the_user_edit_page_and_verify_all_permissions_are_save_properly(driver):
    """reopen the user edit page and verify all permissions are save properly."""
    assert wait_on_element_disappear(driver, 60, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_Edit_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_Edit_Button).click()
    assert wait_on_element(driver, 10, xpaths.add_User.edit_Title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)
    time.sleep(1)
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


@then('revert your changes, click save, and return to dashboard')
def revert_your_changes_click_save_and_return_to_dashboard(driver):
    """revert your changes, click save, and return to dashboard."""
    assert wait_on_element(driver, 2, xpaths.add_User.home_Mode_Group_Write_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.add_User.home_Mode_Group_Write_Checkbox).click()
    driver.find_element_by_xpath(xpaths.add_User.home_Mode_Group_Exec_Checkbox).click()
    driver.find_element_by_xpath(xpaths.add_User.home_Mode_Other_Write_Checkbox).click()
    driver.find_element_by_xpath(xpaths.add_User.home_Mode_Other_Exec_Checkbox).click()
    time.sleep(0.5)
    wait_on_element(driver, 10, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()

    rsc.Confirm_Warning(driver)

    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_User)
