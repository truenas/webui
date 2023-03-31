# coding=utf-8
"""SCALE UI: feature tests."""

import reusableSeleniumCode as rsc
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


@scenario('features/NAS-T1345.feature', 'Apps Page - Validate plex')
def test_apps_page__validate_plex():
    """Apps Page - Validate plex."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password, request):
    """the browser is open, navigate to the SCALE URL, and login."""
    depends(request, ['App_readd_pool'], scope='session')
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
        assert wait_on_element(driver, 5, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()


@when('on the Dashboard, click Apps on the side menu')
def on_the_dashboard_click_apps_on_the_side_menu(driver):
    """on the Dashboard, click Apps on the side menu."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)
    assert wait_on_element(driver, 10, xpaths.side_Menu.apps, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.apps).click()


@then('on Application page click on the Available Applications tab')
def on_application_page_click_on_the_available_applications_tab(driver):
    """on Application page click on the Available Applications tab."""
    assert wait_on_element(driver, 10, xpaths.applications.available_Applications_Tab, 'clickable')
    driver.find_element_by_xpath(xpaths.applications.available_Applications_Tab).click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)


@then('on the Plex card click the Install button')
def on_the_plex_card_click_the_install_Button(driver):
    """on the Plex card click the Install button."""
    assert wait_on_element(driver, 7, xpaths.applications.card('plex'))
    assert wait_on_element(driver, 20, xpaths.applications.install_Button('plex'), 'clickable')
    driver.find_element_by_xpath(xpaths.applications.install_Button('plex')).click()
    if is_element_present(driver, xpaths.popup.please_Wait):
        assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)


@then('Enter an application name')
def enter_an_application_name(driver):
    """Enter an application name."""
    assert wait_on_element(driver, 7, xpaths.app_Setup.title('plex'))
    assert wait_on_element(driver, 7, xpaths.app_Setup.app_Name_Input)
    driver.find_element_by_xpath(xpaths.app_Setup.app_Name_Input).clear()
    driver.find_element_by_xpath(xpaths.app_Setup.app_Name_Input).send_keys('plex-test')


@then('click save, wait for the installation to finish')
def click_save_wait_for_the_installation_to_finish(driver):
    """click save, wait for the installation to finish."""
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()

    assert wait_on_element(driver, 5, xpaths.popup.installing)
    assert wait_on_element_disappear(driver, 240, xpaths.popup.installing)


@then('confirm installation is successful and the App is active')
def confirm_installation_is_successful_and_the_app_is_active(driver):
    """confirm installation is successful and the App is active."""
    assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)
    assert wait_on_element(driver, 20, '//strong[contains(.,"plex-test")]')

    rsc.Verify_App_Status(driver, "plex-test", "plex")
