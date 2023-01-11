# coding=utf-8
"""High Availability (tn-bhyve01) feature tests."""

from selenium.webdriver.common.keys import Keys
import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
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


@scenario('features/NAS-T951.feature', 'Edit user auxiliary group')
def test_edit_user_auxiliary_group(driver):
    """Edit user auxiliary group."""
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


@then('Add user to additional groups, like wheel and save change')
def add_user_to_additional_groups_like_wheel_and_save_change(driver):
    """Add user to additional groups, like wheel and save change."""
    assert wait_on_element(driver, 7, '//legend[normalize-space(text())="Identification"]')
    assert wait_on_element(driver, 7, '//legend[normalize-space(text())="Authentication"]')
    element = driver.find_element_by_xpath('//legend[normalize-space(text())="Authentication"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 7, '//ix-select[@formcontrolname="groups"]//mat-select', 'clickable')
    driver.find_element_by_xpath('//ix-select[@formcontrolname="groups"]//mat-select').click()
    assert wait_on_element(driver, 7, '//mat-option[contains(.,"root")]', 'clickable')
    driver.find_element_by_xpath('//mat-option[contains(.,"root")]').click()
    driver.find_element_by_xpath('//mat-option[contains(.,"root")]').send_keys(Keys.TAB)
    assert wait_on_element(driver, 7, '//button[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Save")]').click()


@then('Change should be saved')
def change_should_be_saved(driver):
    """Change should be saved."""
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, '//h1[text()="Users"]')


@then('reopen the user edit page and ensure that the additional group was saved')
def reopen_the_user_edit_page_and_ensure_that_the_additional_group_was_saved(driver):
    """reopen the user edit page and ensure that the additional group was saved."""
    assert wait_on_element(driver, 7, '//tr[contains(.,"ericbsd")]/td', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]/td').click()
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//button[contains(.,"Edit")]').click()
    assert wait_on_element(driver, 7, '//h3[text()="Edit User"]')
    assert wait_on_element(driver, 7, '//legend[normalize-space(text())="Identification"]')


@then('Aux Group added should be visible')
def aux_group_added_should_be_visible(driver):
    """Aux Group added should be visible."""
    assert wait_on_element(driver, 7, '//mat-select[contains(.,"root,")]')
    assert wait_on_element(driver, 7, '//ix-modal-header//mat-icon[contains(.,"cancel")]', 'clickable')
    driver.find_element_by_xpath('//ix-modal-header//mat-icon[contains(.,"cancel")]').click()
