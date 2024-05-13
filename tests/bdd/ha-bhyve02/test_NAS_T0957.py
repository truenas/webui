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


@scenario('features/NAS-T957.feature', 'Verify invalid email cannot enter be in the User Edit Page')
def test_verify_invalid_email_cannot_enter_be_in_the_user_edit_page(driver):
    """Verify invalid email cannot enter be in the User Edit Page."""
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
    time.sleep(0.5)


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


@then(parsers.parse('Change the users email to an invalid email i.e. "{invalid_email}" and click Save'))
def change_the_users_email_to_an_invalid_email_ie_email_and_click_save(driver, invalid_email):
    """Change the users email to an invalid email i.e. "{email}" and click Save."""
    assert wait_on_element(driver, 7, xpaths.add_User.identification_Legend)
    assert wait_on_element(driver, 7, xpaths.add_User.email_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.add_User.email_Input).clear()
    driver.find_element_by_xpath(xpaths.add_User.email_Input).send_keys(invalid_email)
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable') is False


@then('You should not be allowed to save the invalid email')
def you_should_not_be_allowed_to_save_the_invalid_email(driver):
    """You should not be allowed to save the invalid email."""
    assert wait_on_element(driver, 7, xpaths.add_User.email_Error_Message)


@then('Try saving a blank email')
def try_saving_a_blank_email(driver):
    """Try saving a blank email."""
    assert wait_on_element(driver, 7, xpaths.add_User.email_Input, 'clickable')
    driver.find_element_by_xpath(xpaths.add_User.email_Input).clear()
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable') is False


@then('You should not be allowed to save a blank email')
def You_should_not_be_allowed_to_save_a_blank_email(driver):
    """You should not be allowed to save a blank email."""
    assert wait_on_element(driver, 7, xpaths.add_User.email_Error_Message)
    driver.find_element_by_xpath(xpaths.button.close_Icon).click()
