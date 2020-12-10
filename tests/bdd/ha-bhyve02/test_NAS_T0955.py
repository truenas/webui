# coding=utf-8
"""High Availability (tn-bhyve01) feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T955.feature', 'Edit User Change Password')
def test_edit_user_change_password(driver):
    """Edit User Change Password."""


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """The browser is open navigate to "{nas_user}"."""
    global host
    host = nas_url
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        time.sleep(3)


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_root_and_password(driver, user, password):
    """If login page appear enter "{user}" and "{password}"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 0.5, 5, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 0.5, 7, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('You should see the dashboard')
def you_should_see_the_dashboard(driver):
    """You should see the dashboard."""
    assert wait_on_element(driver, 1, 10, '//h1[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 1, 10, '//span[contains(.,"System Information")]')


@then('Click on the Credentials item in the left side menu')
def click_on_the_credentials_item_in_the_left_side_menu(driver):
    """Click on the Credentials item in the left side menu."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()


@then('The Credentials menu should expand to the right')
def the_credentials_menu_should_expand_to_the_right(driver):
    """The Credentials menu should expand to the right."""
    assert wait_on_element(driver, 1, 7, '//mat-list-item[@ix-auto="option__Local Users"]')


@then('Click on Local Users')
def click_on_localusers(driver):
    """Click on Local Users."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Local Users"]').click()


@then('The Users page should open')
def the_users_page_should_open(driver):
    """The Users page should open."""
    assert wait_on_element(driver, 1, 7, '//div[contains(.,"Users")]')


@then('On the right side of the table, click the expand arrow for one of the users')
def on_the_right_side_of_the_table_click_the_expand_arrow_for_one_of_the_users(driver):
    """On the right side of the table, click the expand arrow for one of the users."""
    assert wait_on_element(driver, 0.5, 7, '//tr[@ix-auto="expander__ericbsd"]/td')
    driver.find_element_by_xpath('//tr[@ix-auto="expander__ericbsd"]/td').click()


@then('The User Field should expand down to list further details')
def the_user_field_should_expand_down_to_list_further_details(driver):
    """The User Field should expand down to list further details."""
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__EDIT_ericbsd"]')


@then('Click the Edit button that appears')
def click_the_edit_button_that_appears(driver):
    """Click the Edit button that appears."""
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_ericbsd"]').click()


@then('The User Edit Page should open')
def the_user_edit_page_should_open(driver):
    """The User Edit Page should open."""
    assert wait_on_element(driver, 1, 7, '//h3[contains(.,"Edit User")]')


@then('Change the password in both fields and click save')
def change_the_password_in_both_fields_and_click_save(driver):
    """Change the password in both fields and click save."""
    assert wait_on_element(driver, 1, 7, '//input[@ix-auto="input__Password"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Password"]').send_keys('testing1')
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').send_keys('testing1')


@then('Change should be saved')
def change_should_be_saved(driver):
    """Change should be saved."""
    assert wait_on_element(driver, 1, 7, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 1, 7, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 1, 7, '//div[contains(.,"Users")]')


@then('Log out and try to log back in with the old password for that user')
def log_out_and_try_to_log_back_in_with_the_old_password_for_that_user(driver):
    """Log out and try to log back in with the old password for that user."""
    global ssh_result
    ssh_result = ssh_cmd('ls -la', 'ericbsd', 'testing', host)


@then('User should not be able to log in ssh with the old password')
def user_should_not_be_able_to_log_in_ssh_with_the_old_password(driver):
    """User should not be able to log in ssh with the old password."""
    assert not ssh_result['result'], ssh_result['output']
    assert '..' not in ssh_result['output'], ssh_result['output']


@then('Try to log back in ssh with the new password for that user')
def try_to_log_back_in_ssh_with_the_new_password_for_that_user(driver):
    """Try to log back in ssh with the new password for that user."""
    global ssh_result
    ssh_result = ssh_cmd('ls -la', 'ericbsd', 'testing1', host)


@then('User should be able to log in with new password')
def user_should_be_able_to_log_in_with_new_password(driver):
    """User should be able to log in with new password."""
    assert ssh_result['result'], ssh_result['output']
    assert '..' in ssh_result['output'], ssh_result['output']
