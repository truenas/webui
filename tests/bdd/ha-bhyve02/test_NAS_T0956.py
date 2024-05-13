# coding=utf-8
"""High Availability (tn-bhyve06) feature tests."""

import reusableSeleniumCode as rsc
import time
import xpaths
from function import (
    wait_on_element
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends


@scenario('features/NAS-T956.feature', 'Edit User Try Change Password with mismatched passwords')
def test_edit_user_try_change_password_with_mismatched_passwords(driver):
    """Edit User Try Change Password with mismatched passwords."""
    pass


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url, request):
    """The browser is open navigate to "{nas_user}"."""
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
    rsc.Verify_The_Dashboard(driver)


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
    assert wait_on_element(driver, 7, xpaths.users.eric_User, 'clickable')
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
    time.sleep(0.5)


@then('Change the password in both fields but make sure they are different and try to click save.')
def change_the_password_in_both_fields_but_make_sure_they_are_different_and_try_to_click_save(driver):
    """Change the password in both fields but make sure they are different and try to click save.."""
    assert wait_on_element(driver, 5, xpaths.add_User.password_Input, 'clickable')
    driver.find_element_by_xpath(xpaths.add_User.password_Input).clear()
    driver.find_element_by_xpath(xpaths.add_User.password_Input).send_keys('testing')
    driver.find_element_by_xpath(xpaths.add_User.confirm_Password_Input).clear()
    driver.find_element_by_xpath(xpaths.add_User.confirm_Password_Input).send_keys('testing2')


@then('You should not be able to save the changes')
def you_should_not_be_able_to_save_the_changes(driver):
    """You should not be able to save the changes."""
    assert wait_on_element(driver, 7, xpaths.button.save)
    element = driver.find_element_by_xpath(xpaths.button.save)
    class_attribute = element.get_attribute('disabled')
    assert class_attribute == 'true'
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element(driver, 30, xpaths.add_User.edit_Title)
    assert wait_on_element(driver, 30, '//mat-error[contains(.,"New password and confirmation should match.")]')
    driver.find_element_by_xpath(xpaths.button.close_Icon).click()
