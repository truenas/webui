# coding=utf-8
"""SCALE UI: feature tests."""

import reusableSeleniumCode as rsc
import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    ssh_sudo_exptext
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
from pytest_dependency import depends


@scenario('features/NAS-T1094.feature', 'Enable password for a user')
def test_enable_password_for_a_user():
    """Enable password for a user."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['First_User', 'Setup_SSH'], scope='session')
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


@when('you should be on the dashboard, click on the Accounts on the side menu, click on Users')
def you_should_be_on_the_dashboard_click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """you should be on the dashboard, click on the Accounts on the side menu, click on Users."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 10, xpaths.side_Menu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.side_Menu.local_User, 'clickable')
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


@then('Enable Samba Authentication disable "Disable Password" toggle')
def enable_samba_authentication_disable_disable_password_toggle(driver):
    """Enable Samba Authentication disable "Disable Password" toggle."""
    assert wait_on_element(driver, 7, xpaths.add_User.identification_Legend)
    assert wait_on_element(driver, 7, xpaths.add_User.authentication_Legend)
    rsc.Click_On_Element(driver, xpaths.add_User.password_Disabled_Slide)
    rsc.Click_On_Element(driver, xpaths.add_User.samba_Authentication_Checkbox)


@then('Enter the Password and and click save')
def enter_the_password_and_and_click_save(driver):
    """Enter the Password and and click save."""
    rsc.Input_Value(driver, xpaths.add_User.password_Input, 'testing')
    rsc.Input_Value(driver, xpaths.add_User.confirm_Password_Input, 'testing')
    rsc.Click_On_Element(driver, xpaths.button.save)


@then('Change should be saved')
def change_should_be_saved(driver):
    """Change should be saved."""
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, xpaths.users.title)


@then('Open the user drop down to verify the user Disable Password is false')
def open_the_user_drop_down_to_verify_the_user_disable_password_is_false(driver):
    """Open the user drop down to verify the user Disable Password is false."""
    assert wait_on_element(driver, 7, xpaths.users.eric_Edit_Button)
    assert wait_on_element(driver, 7, xpaths.users.eric_Password_Disable)


@then('Updated value should be visible')
def updated_value_should_be_visible(driver):
    """Updated value should be visible."""
    element_text = driver.find_element_by_xpath(xpaths.users.eric_Password_Disable_Text).text
    assert element_text == 'No'


@then('Try login, the user should be able to login')
def try_login_the_user_should_be_able_to_login(nas_ip):
    """Try login, the user should be able to login."""
    time.sleep(1)
    assert ssh_sudo_exptext('ls /var/lib/sudo', nas_ip, 'ericbsd', 'testing', 'lectured')
