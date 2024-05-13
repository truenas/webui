# coding=utf-8
"""High Availability (tn-bhyve06) feature tests."""

import reusableSeleniumCode as rsc
import time
import xpaths
from function import (
    wait_on_element,
    wait_on_element_disappear,
    ssh_sudo_exptext
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends


@scenario('features/NAS-T953.feature', 'Edit User Disable Password')
def test_edit_user_disable_password(driver):
    """Edit User Disable Password."""
    pass


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url, request):
    """The browser is open navigate to "{nas_user}"."""
    depends(request, ['First_User', 'Setup_SSH'], scope='session')
    global host
    host = nas_url
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


@then('Disable Samba Authentication enable "Disable Password"')
def disable_samba_authentication_enable_disable_password(driver):
    """Disable Samba Authentication enable "Disable Password"."""
    assert wait_on_element(driver, 7, xpaths.add_User.identification_Legend)
    rsc.Click_On_Element(driver, xpaths.add_User.samba_Authentication_Checkbox)
    rsc.Click_On_Element(driver, xpaths.add_User.password_Disabled_Slide)


@then('Click save, the change should be saved')
def click_save_the_change_should_be_saved(driver):
    """Click save, the change should be saved."""
    rsc.Click_On_Element(driver, xpaths.button.save)
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, xpaths.users.title)


@then('Open the user drop down to verify the user Disable Password is true')
def open_the_user_drop_down_to_verify_the_user_disable_password_is_true(driver):
    """Open the user drop down to verify the user Disable Password is true."""
    assert wait_on_element(driver, 7, xpaths.users.eric_Password_Disable)


@then('Updated value should be visible')
def updated_value_should_be_visible(driver):
    """Updated value should be visible."""
    assert wait_on_element(driver, 5, xpaths.users.eric_Password_Disable_Text)
    element_text = driver.find_element_by_xpath(xpaths.users.eric_Password_Disable_Text).text
    assert element_text == 'Yes'


@then('Try login, the user should not be able to login')
def try_login_the_user_should_not_be_able_to_login():
    """Try login, the user should not be able to login."""
    assert ssh_sudo_exptext('ls /tmp', host, 'ericbsd', 'testing', 'Sorry, try again')
