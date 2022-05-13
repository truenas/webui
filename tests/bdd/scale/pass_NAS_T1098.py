# coding=utf-8
"""SCALE UI: feature tests."""

import time
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


@scenario('features/NAS-T1098.feature', 'Change the permissions of a user home directory')
def test_change_the_permissions_of_a_user_home_directory():
    """Change the permissions of a user home directory."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, click on the Accounts on the side menu, click on Users')
def on_the_dashboard_click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """on the dashboard, click on the Accounts on the side menu, click on Users."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]').click()


@when('the Users page should open, click the Greater-Than-Sign right of the users')
def the_users_page_should_open_click_the_greaterthansign_right_of_the_users(driver):
    """the Users page should open, click the Greater-Than-Sign right of the users."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()


@then('the User Field should expand down, click the Edit button')
def the_user_field_should_expand_down_click_the_edit_button(driver):
    """the User Field should expand down, click the Edit button."""
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]').click()


@then('the User Edit Page should open, change some permissions for the Home Directory and click save')
def the_user_edit_page_should_open_change_some_permissions_for_the_home_directory_and_click_save(driver):
    """the User Edit Page should open, change some permissions for the Home Directory and click save."""
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    time.sleep(1)
    assert wait_on_element(driver, 2, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_groupExec"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_otherWrite"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_otherExec"]').click()
    time.sleep(0.5)
    wait_on_element(driver, 10, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('reopen the user edit page and verify all permissions are save properly')
def reopen_the_user_edit_page_and_verify_all_permissions_are_save_properly(driver):
    """reopen the user edit page and verify all permissions are save properly."""
    assert wait_on_element_disappear(driver, 60, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]').click()
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    time.sleep(1)
    assert wait_on_element(driver, 2, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_ownerWrite"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_ownerRead"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_ownerExec"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupRead"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupExec"]', 'class', 'mat-checkbox-checked') is False
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_otherRead"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_otherWrite"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_otherExec"]', 'class', 'mat-checkbox-checked') is False


@then('revert your changes, click save, and return to dashboard')
def revert_your_changes_click_save_and_return_to_dashboard(driver):
    """revert your changes, click save, and return to dashboard."""
    assert wait_on_element(driver, 2, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_groupExec"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_otherWrite"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_otherExec"]').click()
    time.sleep(0.5)
    wait_on_element(driver, 10, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
