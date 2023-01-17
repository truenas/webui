# coding=utf-8
"""High Availability (tn-bhyve01) feature tests."""

import reusableSeleniumCode as rsc
import time
import xpaths
from function import (
    wait_on_element,
    wait_on_element_disappear
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends


@scenario('features/NAS-T952.feature', 'Edit user home directory')
def test_edit_user_home_directory(driver):
    """Edit user home directory."""
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


@then('Change the path of the users Home Directory')
def change_the_path_of_the_users_home_directory(driver):
    """Change the path of the users Home Directory."""
    assert wait_on_element(driver, 7, '//legend[normalize-space(text())="Identification"]')
    assert wait_on_element(driver, 7, '//ix-explorer[@formcontrolname="home"]//input', 'inputable')
    driver.find_element_by_xpath('//ix-explorer[@formcontrolname="home"]//input').clear()
    driver.find_element_by_xpath('//ix-explorer[@formcontrolname="home"]//input').send_keys('/mnt/tank/ericbsd')


@then('Change should be saved')
def change_should_be_saved(driver):
    """Change should be saved."""
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 5, '//h1[text()="Users"]')


@then('open the drop down details pane for the user')
def open_the_drop_down_details_pane_for_the_user(driver):
    """open the drop down details pane for the user."""
    assert wait_on_element(driver, 5, '//tr[contains(.,"ericbsd")]/td', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]/td').click()
    assert wait_on_element(driver, 7, '//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//button[contains(.,"Edit")]', 'clickable')
    assert wait_on_element(driver, 5, '//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//dt[contains(text(),"Home Directory")]')


@then('verify that the home directory has changed')
def verify_that_the_home_directory_has_changed(driver):
    """verify that the home directory has changed."""
    assert wait_on_element(driver, 5, '//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//dd[contains(text(),"/mnt/tank/ericbsd")]')
