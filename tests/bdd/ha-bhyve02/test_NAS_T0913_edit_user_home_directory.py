# coding=utf-8
"""High Availability (tn-bhyve02) feature tests."""

from function import wait_on_element, is_element_present, wait_on_element_disappear
import time
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T913.feature', 'Edit user home directory')
def test_edit_user_home_directory(driver):
    """Edit user home directory."""


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_tnbhyve02tnixsystemsnet(driver, nas_url):
    """The browser is open navigate to "{nas_user}"."""
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        time.sleep(3)


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_root_and_testing(driver, user, password):
    """If login page appear enter "{user}" and "{password}"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        wait_on_element(driver, 0.5, 5, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(password)
        wait_on_element(driver, 0.5, 30, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('You should see the dashboard')
def you_should_see_the_dashboard(driver):
    """You should see the dashboard."""
    wait_on_element(driver, 0.5, 30, '//span[contains(.,"System Information")]')
    driver.find_element_by_xpath('//span[contains(.,"System Information")]')


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
    wait_on_element(driver, 0.5, 30, '//mat-list-item[@ix-auto="option__Users"]')
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
    wait_on_element(driver, 0.5, 30, '//div[contains(.,"Users")]')
    driver.find_element_by_xpath('//div[contains(.,"Users")]')


@then('On the right side of the table, click the Greater-Than-Sign for one of the users')
def on_the_right_side_of_the_table_click_the_greaterthansign_for_one_of_the_users(driver):
    """On the right side of the table, click the Greater-Than-Sign for one of the users."""
    driver.find_element_by_xpath('//a[@ix-auto="expander__ericbsd"]').click()


@then('The User Field should expand down to list further details')
def the_user_field_should_expand_down_to_list_further_details(driver):
    """The User Field should expand down to list further details."""
    wait_on_element(driver, 0.5, 30, '//button[@ix-auto="button__EDIT_ericbsd"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_ericbsd"]')


@then('Click the Edit button that appears')
def click_the_edit_button_that_appears(driver):
    """Click the Edit button that appears."""
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_ericbsd"]').click()


@then('The User Edit Page should open')
def the_user_edit_page_should_open(driver):
    """The User Edit Page should open."""
    wait_on_element(driver, 0.5, 30, '//h4[contains(.,"Identification")]')
    driver.find_element_by_xpath('//h4[contains(.,"Identification")]')


@then('Change the path of the users Home Directory')
def change_the_path_of_the_users_home_directory(driver):
    """Change the path of the users Home Directory."""
    driver.find_element_by_xpath('//input[@ix-auto="input__home"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__home"]').send_keys('/mnt/tank/ericbsd')


@then('Change should be saved')
def change_should_be_saved(driver):
    """Change should be saved."""
    wait_on_element(driver, 0.5, 30, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    wait_on_element_disappear(driver, 1, 30, '//h6[contains(.,"Please wait")]')
    wait_on_element(driver, 0.5, 30, '//div[contains(.,"Users")]')


@then('open the drop down details pane for the user')
def open_the_drop_down_details_pane_for_the_user(driver):
    """open the drop down details pane for the user."""
    driver.find_element_by_xpath('//a[@ix-auto="expander__ericbsd"]').click()
    wait_on_element(driver, 0.5, 30, '//button[@ix-auto="button__EDIT_ericbsd"]')
    driver.find_element_by_xpath('//h4[contains(.,"Email:")]')


@then('verify that the home directory has changed')
def verify_that_the_home_directory_has_changed(driver):
    """verify that the home directory has changed."""
    driver.find_element_by_xpath('//p[contains(.,"/mnt/tank/ericbsd")]')
