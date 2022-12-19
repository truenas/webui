# coding=utf-8
"""SCALE UI feature tests."""

import time
import xpaths
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


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the FreeNAS URL and logged in."""
    depends(request, ['First_User'], scope='session')
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_input)
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('you should be on the dashboard, click on the Accounts on the side menu, click on Users')
def you_should_be_on_the_dashboard_click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """you should be on the dashboard, click on the Accounts on the side menu, click on Users."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 10, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.sideMenu.local_user, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.local_user).click()


@when('the Users page should open, click the down carat sign right of the users')
def the_users_page_should_open_click_the_down_carat_sign_right_of_the_users(driver):
    """the Users page should open, click the down carat sign right of the users."""
    assert wait_on_element(driver, 10, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_user, 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()


@when('the User Field should expand down, then click the Edit button')
def the_user_field_should_expand_down_then_click_the_edit_button(driver):
    """the User Field should expand down, then click the Edit button."""
    # time.sleep(1)
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::tr)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::tr)[1]//button[contains(.,"Edit")]').click()


@when('the User Edit Page should open, change the user shell and click save')
def the_user_edit_page_should_open_change_the_user_shell_and_click_save(driver):
    """the User Edit Page should open, change the user shell and click save."""
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, xpaths.popup.pleaseWait)
    element = driver.find_element_by_xpath(xpaths.button.save)
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Shell"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Shell"]').click()
    assert wait_on_element(driver, 10, '//span[contains(.,"zsh")]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Shell_zsh"]').click()
    wait_on_element(driver, 10, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('open the user dropdown, and verify the shell value has changed')
def open_the_user_dropdown_and_verify_the_shell_value_has_changed(driver):
    """open the user dropdown, and verify the shell value has changed."""
    assert wait_on_element_disappear(driver, 20, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 10, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_user, 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '//div[contains(.,"zsh")]')
