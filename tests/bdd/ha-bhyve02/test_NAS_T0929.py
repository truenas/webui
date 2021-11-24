# coding=utf-8
"""High Availability (tn-bhyve02) feature tests."""

import time
from function import wait_on_element, is_element_present, attribute_value_exist
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T929.feature', 'Change user home directory permissions')
def test_change_user_home_directory_permissions(driver):
    """Change user home directory permissions."""


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """The browser is open navigate to "{nas_url}"."""
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        time.sleep(1)


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_root_and_password(driver, user, password):
    """If login page appear enter "{user}" and "{password}"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 5, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('You should see the dashboard')
def you_should_see_the_dashboard(driver):
    """You should see the dashboard."""
    assert wait_on_element(driver, 5, '//span[contains(.,"System Information")]')


@then('Click on the Accounts, Click on Users')
def click_on_the_accounts_click_on_users(driver):
    """Click on the Accounts, Click on Users."""
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Accounts"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Accounts"]').click()
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Users"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Users"]').click()


@then('The Users page should open')
def the_users_page_should_open(driver):
    """The Users page should open."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//div[@ix-auto="value__ericbsd_Username"]')


@then('On the right side of the table, click the Greater-Than-Sign for one of the users')
def on_the_right_side_of_the_table_click_the_greaterthansign_for_one_of_the_users(driver):
    """On the right side of the table, click the Greater-Than-Sign for one of the users."""
    assert wait_on_element(driver, 5, '//a[@ix-auto="expander__ericbsd"]')
    assert wait_on_element(driver, 7, '//a[@ix-auto="expander__ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="expander__ericbsd"]').click()


@then('The User Field should expand down to list further details')
def the_user_field_should_expand_down_to_list_further_details(driver):
    """The User Field should expand down to list further details."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__EDIT_ericbsd"]', 'clickable')


@then('Click the Edit button that appears')
def click_the_edit_button_that_appears(driver):
    """Click the Edit button that appears."""
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_ericbsd"]').click()


@then('The User Edit Page should open')
def the_user_edit_page_should_open(driver):
    """The User Edit Page should open."""
    assert wait_on_element(driver, 5, '//h4[contains(.,"Identification")]')
    time.sleep(2)


@then('Change the permissions for the Users Home Directory (invert them) and click save')
def change_the_permissions_for_the_users_home_directory_invert_them_and_click_save(driver):
    """Change the permissions for the Users Home Directory (invert them) and click save."""
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


@then('Change should be saved')
def change_should_be_saved(driver):
    """Change should be saved."""
    assert wait_on_element(driver, 10, '//div[@ix-auto="value__ericbsd_Username"]')


@then('Reopen the user edit page and ensure that the additional Aux Group was saved')
def reopen_the_user_edit_page_and_ensure_that_the_additional_aux_group_was_saved(driver):
    """Reopen the user edit page and ensure that the additional Aux Group was saved."""
    assert wait_on_element(driver, 5, '//a[@ix-auto="expander__ericbsd"]')
    assert wait_on_element(driver, 7, '//a[@ix-auto="expander__ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="expander__ericbsd"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__EDIT_ericbsd"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_ericbsd"]').click()
    assert wait_on_element(driver, 5, '//h4[contains(.,"Identification")]')
    time.sleep(1)


@then('The changed permissions should be what they were changed to')
def the_changed_permissions_should_be_what_they_were_changed_to(driver):
    """The changed permissions should be what they were changed to."""
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__home_mode_ownerWrite"]', 'clickable')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_ownerWrite"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_ownerRead"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_ownerExec"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupRead"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupExec"]', 'class', 'mat-checkbox-checked') is False
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_otherRead"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_otherWrite"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_otherExec"]', 'class', 'mat-checkbox-checked') is False
    # setting back the original permission for future test
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_groupExec"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_otherWrite"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_otherExec"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element(driver, 5, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 5, '//div[@ix-auto="value__ericbsd_Username"]')
