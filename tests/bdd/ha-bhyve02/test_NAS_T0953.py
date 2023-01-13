# coding=utf-8
"""High Availability (tn-bhyve01) feature tests."""

import time
import xpaths
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
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 5, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys(user)
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(password)
        assert wait_on_element(driver, 7, xpaths.login.signin_button, 'clickable')
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@then('You should see the dashboard')
def you_should_see_the_dashboard(driver):
    """You should see the dashboard."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)


@then('Click on the Credentials item in the left side menu')
def click_on_the_credentials_item_in_the_left_side_menu(driver):
    """Click on the Credentials item in the left side menu."""
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()


@then('The Credentials menu should expand to the right')
def the_credentials_menu_should_expand_to_the_right(driver):
    """The Credentials menu should expand to the right."""
    assert wait_on_element(driver, 7, '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]', 'clickable')


@then('Click on Local Users')
def click_on_localusers(driver):
    """Click on Local Users."""
    driver.find_element_by_xpath('//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]').click()


@then('The Users page should open')
def the_users_page_should_open(driver):
    """The Users page should open."""
    assert wait_on_element(driver, 7, '//h1[text()="Users"]')


@then('On the right side of the table, click the expand arrow for one of the users')
def on_the_right_side_of_the_table_click_the_expand_arrow_for_one_of_the_users(driver):
    """On the right side of the table, click the expand arrow for one of the users."""
    assert wait_on_element(driver, 7, '//tr[contains(.,"ericbsd")]/td', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]/td').click()


@then('The User Field should expand down to list further details')
def the_user_field_should_expand_down_to_list_further_details(driver):
    """The User Field should expand down to list further details."""
    assert wait_on_element(driver, 7, '//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//button[contains(.,"Edit")]', 'clickable')


@then('Click the Edit button that appears')
def click_the_edit_button_that_appears(driver):
    """Click the Edit button that appears."""
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//button[contains(.,"Edit")]').click()


@then('The User Edit Page should open')
def the_user_edit_page_should_open(driver):
    """The User Edit Page should open."""
    assert wait_on_element(driver, 7, '//h3[text()="Edit User"]')
    time.sleep(0.5)


@then('Change "Disable Password" to Yes and click save')
def change_disable_password_to_no_and_click_save(driver):
    """Change "Disable Password" to No and click save."""
    assert wait_on_element(driver, 7, '//legend[normalize-space(text())="Identification"]')
    assert wait_on_element(driver, 7, '//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle', 'clickable')
    driver.find_element_by_xpath('//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle').click()


@then('Change should be saved')
def change_should_be_saved(driver):
    """Change should be saved."""
    assert wait_on_element(driver, 7, '//button[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Save")]').click()
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, '//h1[text()="Users"]')


@then('Open the user drop down to verify the user Disable Password is true')
def open_the_user_drop_down_to_verify_the_user_disable_password_is_true(driver):
    """Open the user drop down to verify the user Disable Password is true."""
    assert wait_on_element(driver, 5, '//tr[contains(.,"ericbsd")]/td', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]/td').click()
    assert wait_on_element(driver, 7, '//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//button[contains(.,"Edit")]')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//dt[contains(.,"Password Disabled:")]')


@then('Updated value should be visible')
def updated_value_should_be_visible(driver):
    """Updated value should be visible."""
    assert wait_on_element(driver, 5, '//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//dt[contains(.,"Password Disabled:")]/../dd')
    element_text = driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//dt[contains(.,"Password Disabled:")]/../dd').text
    assert element_text == 'true'


@then('Try login with ssh')
def try_login_with_ssh(driver):
    """Try login with ssh."""
    global ssh_result
    ssh_result = ssh_cmd('ls -la', 'ericbsd', 'testing', host)


@then('User should not be able to login')
def user_should_not_be_able_to_login(driver):
    """User should not be able to login."""
    assert not ssh_result['result'], ssh_result['output']
    assert '..' not in ssh_result['output'], ssh_result['output']
