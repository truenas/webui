# coding=utf-8
"""SCALE UI feature tests."""

import xpaths
import reusableSeleniumCode as rsc
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
from pytest_dependency import depends


@scenario('features/NAS-T1068.feature', 'Change Shell for user')
def test_change_shell_for_user():
    """Change Shell for user."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['First_User'], scope='session')
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


@when('the Users page should open, click the down carat sign right of the users')
def the_users_page_should_open_click_the_down_carat_sign_right_of_the_users(driver):
    """the Users page should open, click the down carat sign right of the users."""
    assert wait_on_element(driver, 10, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_User, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_User).click()


@when('the User Field should expand down, then click the Edit button')
def the_user_field_should_expand_down_then_click_the_edit_button(driver):
    """the User Field should expand down, then click the Edit button."""
    # time.sleep(1)
    assert wait_on_element(driver, 10, xpaths.users.eric_Edit_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_Edit_Button).click()


@when('the User Edit Page should open, change the user shell and click save')
def the_user_edit_page_should_open_change_the_user_shell_and_click_save(driver):
    """the User Edit Page should open, change the user shell and click save."""
    assert wait_on_element(driver, 10, xpaths.add_User.edit_Title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)
    rsc.Scroll_To(driver, xpaths.button.save)
    assert wait_on_element(driver, 5, xpaths.add_User.shell_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.add_User.shell_Select).click()
    assert wait_on_element(driver, 10, xpaths.add_User.bash_Shell_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.add_User.bash_Shell_Option).click()
    wait_on_element(driver, 10, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('open the user dropdown, and verify the shell value has changed')
def open_the_user_dropdown_and_verify_the_shell_value_has_changed(driver):
    """open the user dropdown, and verify the shell value has changed."""
    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, xpaths.users.user_Bash_Shell)
