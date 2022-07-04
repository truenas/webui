# coding=utf-8
"""High Availability (tn-bhyve01) feature tests."""

import time
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


@scenario('features/NAS-T949.feature', 'Edit user enable Permit Sudo')
def test_edit_user_enable_permit_sudo(driver):
    """Edit user enable Permit Sudo."""
    pass


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """The browser is open navigate to "{nas_url}"."""
    global host
    host = nas_url
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        time.sleep(1)


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_user_and_password(driver, user, password):
    """If login page appear enter "{user}" and "{password}"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 7, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 7, '//button[@name="signin_button"]', 'clickable')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('You should see the dashboard')
def you_should_see_the_dashboard(driver):
    """You should see the dashboard."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('Click on the Credentials item in the left side menu')
def click_on_the_credentials_item_in_the_left_side_menu(driver):
    """Click on the Credentials item in the left side menu."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()


@then('The Credentials menu should expand to the right')
def the_credentials_menu_should_expand_to_the_right(driver):
    """The Credentials menu should expand to the right."""
    assert wait_on_element(driver, 7, '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]')


@then('Click on Local Users')
def click_on_localusers(driver):
    """Click on Local Users."""
    driver.find_element_by_xpath('//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]').click()


@then('The Users page should open')
def the_users_page_should_open(driver):
    """The Users page should open."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')


@then('On the right side of the table, click the Greater-Than-Sign for one of the users.')
def on_the_right_side_of_the_table_click_the_greaterthansign_for_one_of_the_users(driver):
    """On the right side of the table, click the Greater-Than-Sign for one of the users.."""
    assert wait_on_element(driver, 7, '//tr[contains(.,"ericbsd")]/td', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]/td').click()


@then('The User Field should expand down to list further details.')
def the_user_field_should_expand_down_to_list_further_details(driver):
    """The User Field should expand down to list further details.."""
    assert wait_on_element(driver, 7, '(//tr[contains(.,"ericbsd")]/following-sibling::tr)[1]//button[contains(.,"Edit")]', 'clickable')


@then('Click the Edit button that appears')
def click_the_edit_button_that_appears(driver):
    """Click the Edit button that appears."""
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::tr)[1]//button[contains(.,"Edit")]').click()


@then('The User Edit Page should open')
def the_user_edit_page_should_open(driver):
    """The User Edit Page should open."""
    assert wait_on_element(driver, 7, '//h3[contains(.,"Edit User")]')
    time.sleep(0.5)


@then('Enable Permit Sudo and click save')
def enable_permit_sudo_and_click_save(driver):
    """Enable Permit Sudo and click save."""
    assert wait_on_element(driver, 7, '//h4[contains(text(),"Identification")]')
    assert wait_on_element(driver, 7, '//h4[contains(text(),"Authentication")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Permit Sudo"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Permit Sudo"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('Change should be saved')
def change_should_be_saved(driver):
    """Change should be saved."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')


@then('Open the user drop down to verify the value has been changed')
def open_the_user_drop_down_to_verify_the_value_has_been_changed(driver):
    """Open the user drop down to verify the value has been changed."""
    assert wait_on_element(driver, 7, '//tr[contains(.,"ericbsd")]/td', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]/td').click()
    assert wait_on_element(driver, 7, '(//tr[contains(.,"ericbsd")]/following-sibling::tr)[1]//button[contains(.,"Edit")]')
    assert wait_on_element(driver, 7, '//tr[contains(.,"ericbsd")]/following-sibling::tr//dt[contains(.,"Permit Sudo:")]')


@then('Updated value should be visible')
def updated_value_should_be_visible(driver):
    """Updated value should be visible."""
    assert wait_on_element(driver, 7, '//tr[contains(.,"ericbsd")]/following-sibling::tr//dt[contains(.,"Permit Sudo:")]/../dd')
    element_text = driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]/following-sibling::tr//dt[contains(.,"Permit Sudo:")]/../dd').text
    assert element_text == 'true'


@then('Open shell and run su user to become that user')
def open_shell_and_run_su_user(driver):
    """Open shell and run su user to become that user."""
    global sudo_results
    cmd = 'sudo ls /var/lib/sudo'
    sudo_results = ssh_sudo(cmd, host, 'ericbsd', 'testing')


@then('User should be able to use Sudo')
def user_should_be_able_to_use_sudo(driver):
    """User should be able to use Sudo."""
    assert "lectured" in sudo_results, str(sudo_results)
