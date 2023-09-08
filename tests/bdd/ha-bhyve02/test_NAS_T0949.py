# coding=utf-8
"""High Availability (tn-bhyve06) feature tests."""

import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    ssh_sudo
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends


@scenario('features/NAS-T949.feature', 'Edit user enable Permit Sudo')
def test_edit_user_enable_permit_sudo(driver):
    """Edit user enable Permit Sudo."""
    pass


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url, request):
    """The browser is open navigate to "{nas_url}"."""
    depends(request, ['First_User', 'Setup_SSH'], scope='session')
    global host
    host = nas_url
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_user_and_password(driver, user, password):
    """If login page appear enter "{user}" and "{password}"."""
    if not is_element_present(driver, xpaths.side_Menu.dashboard):
        assert wait_on_element(driver, 7, xpaths.login.user_Input)
        driver.find_element_by_xpath(xpaths.login.user_Input).clear()
        driver.find_element_by_xpath(xpaths.login.user_Input).send_keys(user)
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(password)
        assert wait_on_element(driver, 7, xpaths.login.signin_Button, 'clickable')
        driver.find_element_by_xpath(xpaths.login.signin_Button).click()
    else:
        assert wait_on_element(driver, 10, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()


@then('You should see the dashboard')
def you_should_see_the_dashboard(driver):
    """You should see the dashboard."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)


@then('Click on the Credentials item in the left side menu')
def click_on_the_credentials_item_in_the_left_side_menu(driver):
    """Click on the Credentials item in the left side menu."""
    assert wait_on_element(driver, 7, xpaths.side_Menu.credentials, 'clickable')
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


@then('On the right side of the table, click the Greater-Than-Sign for one of the users.')
def on_the_right_side_of_the_table_click_the_greaterthansign_for_one_of_the_users(driver):
    """On the right side of the table, click the Greater-Than-Sign for one of the users.."""
    assert wait_on_element(driver, 7, xpaths.users.eric_User, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_User).click()


@then('The User Field should expand down to list further details.')
def the_user_field_should_expand_down_to_list_further_details(driver):
    """The User Field should expand down to list further details.."""
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


@then('Enable Permit Sudo and click save')
def enable_permit_sudo_and_click_save(driver):
    """Enable Permit Sudo and click save."""
    assert wait_on_element(driver, 7, xpaths.add_User.identification_Legend)
    assert wait_on_element(driver, 7, xpaths.add_User.authentication_Legend)
    assert wait_on_element(driver, 7, xpaths.add_User.sudo_Checkbox)
    element = driver.find_element_by_xpath(xpaths.add_User.sudo_Checkbox)
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 7, xpaths.add_User.sudo_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.add_User.sudo_Checkbox).click()
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('Change should be saved')
def change_should_be_saved(driver):
    """Change should be saved."""
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, xpaths.users.title)


@then('Open the user drop down to verify the value has been changed')
def open_the_user_drop_down_to_verify_the_value_has_been_changed(driver):
    """Open the user drop down to verify the value has been changed."""
    assert wait_on_element(driver, 7, xpaths.users.eric_User, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_User).click()


@then('Updated value should be visible')
def updated_value_should_be_visible(driver):
    """Updated value should be visible."""
    assert wait_on_element(driver, 7, xpaths.users.eric_Allowed_Sudo_Commands)
    element_text = driver.find_element_by_xpath(xpaths.users.eric_Allowed_Sudo_Commands).text
    assert element_text == 'ALL'


@then('Open shell and run su user to become that user')
def open_shell_and_run_su_user(driver):
    """Open shell and run su user to become that user."""
    global sudo_results
    cmd = 'sudo ls /var/lib/sudo'
    sudo_results = ssh_sudo(cmd, host, 'ericbsd', 'testing')


@then('User should be able to use Sudo')
def user_should_be_able_to_use_sudo(driver):
    """User should be able to use Sudo."""
    assert 'lectured' in sudo_results, str(sudo_results)
