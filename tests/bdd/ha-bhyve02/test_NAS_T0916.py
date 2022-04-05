# coding=utf-8
"""High Availability (tn-bhyve02) feature tests."""

import time
from function import wait_on_element, is_element_present, wait_on_element_disappear
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T916.feature', 'Edit User Change Password')
def test_edit_user_change_password(driver):
    """Edit User Change Password."""


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """The browser is open navigate to "{nas_user}"."""
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/dashboard/")
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
        assert wait_on_element(driver, 7, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('You should see the dashboard')
def you_should_see_the_dashboard(driver):
    """You should see the dashboard."""
    assert wait_on_element(driver, 7, '//a[text()="Dashboard"]')
    assert wait_on_element(driver, 7, '//span[contains(.,"System Information")]')


@then('Click on the Accounts item in the left side menu')
def click_on_the_accounts_item_in_the_left_side_menu(driver):
    """Click on the Accounts item in the left side menu."""
    element = driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Accounts"]')
    class_attribute = element.get_attribute('class')
    if 'open' not in class_attribute:
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Accounts"]').click()


@then('The Accounts menu should expand down')
def the_accounts_menu_should_expand_down(driver):
    """The Accounts menu should expand down."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Users"]', 'clickable')
    element = driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Accounts"]')
    class_attribute = element.get_attribute('class')
    assert 'open' in class_attribute, class_attribute


@then('Click on Users')
def click_on_users(driver):
    """Click on Users."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Users"]').click()


@then('The Users page should open')
def the_users_page_should_open(driver):
    """The Users page should open."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')


@then('On the right side of the table, click the Greater-Than-Sign for one of the users')
def on_the_right_side_of_the_table_click_the_greaterthansign_for_one_of_the_users(driver):
    """On the right side of the table, click the Greater-Than-Sign for one of the users."""
    assert wait_on_element(driver, 7, '//div[@id="ericbsd_Username"]')
    assert wait_on_element(driver, 7, '//a[@ix-auto="expander__ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="expander__ericbsd"]').click()


@then('The User Field should expand down to list further details')
def the_user_field_should_expand_down_to_list_further_details(driver):
    """The User Field should expand down to list further details."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__EDIT_ericbsd"]', 'clickable')


@then('Click the Edit button that appears')
def click_the_edit_button_that_appears(driver):
    """Click the Edit button that appears."""
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_ericbsd"]').click()


@then('The User Edit Page should open')
def the_user_edit_page_should_open(driver):
    """The User Edit Page should open."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Identification")]')


@then('Change the password in both fields and click save')
def change_the_password_in_both_fields_and_click_save(driver):
    """Change the password in both fields and click save."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Password"]', 'clickable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Password"]').send_keys('testing1')
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').send_keys('testing1')


@then('Change should be saved')
def change_should_be_saved(driver):
    """Change should be saved."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 7, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 7, '//div[@id="ericbsd_Username"]')


@then('Log out and try to log back in with the old password for that user')
def log_out_and_try_to_log_back_in_with_the_old_password_for_that_user(driver):
    """Log out and try to log back in with the old password for that user."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Shell"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shell"]').click()
    assert wait_on_element(driver, 7, '//span[@class="reverse-video terminal-cursor"]')
    time.sleep(4)
    actions = ActionChains(driver)
    actions.send_keys('ssh ericbsd@127.0.0.1', Keys.ENTER)
    actions.perform()
    assert wait_on_element(driver, 4, '//span[contains(.,"password:")]')
    actions = ActionChains(driver)
    actions.send_keys('testing', Keys.ENTER)
    actions.perform()


@then('User should not be able to log in ssh with the old password')
def user_should_not_be_able_to_log_in_ssh_with_the_old_password(driver):
    """User should not be able to log in ssh with the old password."""
    assert wait_on_element(driver, 5, '//span[contains(.,"Permission") and contains(.,"denied,")]')


@then('Try to log back in ssh with the new password for that user')
def try_to_log_back_in_ssh_with_the_new_password_for_that_user(driver):
    """Try to log back in ssh with the new password for that user."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Shell"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shell"]').click()
    assert wait_on_element(driver, 7, '//span[@class="reverse-video terminal-cursor"]')
    time.sleep(4)
    actions = ActionChains(driver)
    actions.send_keys('ssh ericbsd@127.0.0.1', Keys.ENTER)
    actions.perform()
    assert wait_on_element(driver, 4, '//span[contains(.,"password:")]')
    actions = ActionChains(driver)
    actions.send_keys('testing1', Keys.ENTER)
    actions.perform()


@then('User should be able to log in with new password')
def user_should_be_able_to_log_in_with_new_password(driver):
    """User should be able to log in with new password."""
    assert not wait_on_element(driver, 2, '//span[contains(.,"Permission") and contains(.,"denied,")]')
