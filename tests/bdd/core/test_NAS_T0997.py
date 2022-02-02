# coding=utf-8
"""Core UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist,
    wait_for_attribute_value
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when
)


@scenario('features/NAS-T997.feature', 'Change the permissions of a user home directory')
def test_change_the_permissions_of_a_user_home_directory(driver):
    """Change the permissions of a user home directory."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        time.sleep(1)
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        assert wait_on_element(driver, 5, '//span[contains(.,"root")]')
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you should be on the dashboard')
def you_should_be_on_the_dashboard(driver):
    """you should be on the dashboard."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('click on the Accounts on the side menu, click on Users')
def click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """click on the Accounts on the side menu, click on Users."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Accounts"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Accounts"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Users"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Users"]').click()


@then('the Users page should open')
def the_users_page_should_open(driver):
    """the Users page should open."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')


@then('click the Greater-Than-Sign right of the users')
def click_the_greaterthansign_right_of_the_users(driver):
    """click the Greater-Than-Sign right of the users."""
    assert wait_on_element(driver, 7, '//a[@ix-auto="expander__ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="expander__ericbsd"]').click()


@then('the User Field should expand down, then click the Edit button')
def the_user_field_should_expand_down_then_click_the_edit_button(driver):
    """the User Field should expand down, then click the Edit button."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__EDIT_ericbsd"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_ericbsd"]').click()


@then('the User Edit Page should open')
def the_user_edit_page_should_open(driver):
    """the User Edit Page should open."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Identification")]')
    time.sleep(1)


@then('change some permissions for the Home Directory and click save')
def change_some_permissions_for_the_home_directory_and_click_save(driver):
    """change some permissions for the Home Directory and click save."""
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]').click()
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupExec"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_groupExec"]').click()
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__home_mode_otherWrite"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_otherWrite"]').click()
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__home_mode_otherExec"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_otherExec"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('changes should be saved without an error')
def changes_should_be_saved_without_an_error(driver):
    """changes should be saved without an error."""
    assert wait_on_element_disappear(driver, 7, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//div[@ix-auto="value__ericbsd_Username"]')


@then('reopen the user edit page')
def reopen_the_user_edit_page(driver):
    """reopen the user edit page."""
    assert wait_on_element(driver, 5, '//a[@ix-auto="expander__ericbsd"]')
    assert wait_on_element(driver, 7, '//a[@ix-auto="expander__ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="expander__ericbsd"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__EDIT_ericbsd"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_ericbsd"]').click()
    assert wait_on_element(driver, 5, '//h4[contains(.,"Identification")]')


@then('verify all permissions are save properly')
def verify_all_permissions_are_save_properly(driver):
    """verify all permissions are save properly."""
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__home_mode_ownerWrite"]', 'clickable')
    assert wait_for_attribute_value(driver, 5, '//mat-checkbox[@ix-auto="checkbox__home_mode_ownerWrite"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_ownerWrite"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_ownerRead"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_ownerExec"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupRead"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupExec"]', 'class', 'mat-checkbox-checked') is False
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_otherRead"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_otherWrite"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_otherExec"]', 'class', 'mat-checkbox-checked') is False


@then('revert your changes and click save')
def revert_your_changes_and_click_save(driver):
    """revert your changes and click save."""
    # setting back the original permission for future test
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]').click()
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupExec"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_groupExec"]').click()
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__home_mode_otherWrite"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_otherWrite"]').click()
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__home_mode_otherExec"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_otherExec"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 7, '//div[@ix-auto="value__ericbsd_Username"]')
