# coding=utf-8
"""SCALE UI: feature tests."""

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
    when
)
import pytest
from pytest_dependency import depends
pytestmark = [pytest.mark.debug_test]


@pytest.mark.dependency(name='App_Collabora')
@scenario('features/NAS-T1287.feature', 'Apps Page - Validate Collabora')
def test_apps_page__validate_collabora():
    """Apps Page - Validate Collabora."""


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


@when('on the Dashboard, click on apps')
def on_the_dashboard_click_on_apps(driver):
    """on the Dashboard, click on apps."""
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


@then('on the collabora card click the Install button')
def on_the_collabora_card_click_the_install_Button(driver):
    """on the collabora card click the Install button."""
    assert wait_on_element(driver, 7, '//h3[contains(.,"collabora")]')
    assert wait_on_element(driver, 20, '//mat-card[contains(.,"collabora")]//span[contains(.,"Install")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"collabora")]//span[contains(.,"Install")]').click()
    assert wait_on_element(driver, 5, xpaths.popup.please_Wait)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)


@then('Enter an application name')
def enter_an_application_name(driver):
    """Enter an application name."""
    assert wait_on_element(driver, 7, xpaths.app_Setup.title("collabora"))
    assert wait_on_element(driver, 7, xpaths.app_Setup.app_Name_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.app_Setup.app_Name_Input).clear()
    driver.find_element_by_xpath(xpaths.app_Setup.app_Name_Input).send_keys('collabora-test')


@then('under Collabora configuration set a password for WebUI')
def under_collabora_configuration_set_a_password_for_webui(driver):
    """under Collabora configuration set a password for WebUI."""
    driver.find_element_by_xpath(xpaths.app_Setup.password_Input).clear()
    driver.find_element_by_xpath(xpaths.app_Setup.password_Input).send_keys('testingpass')


@then('select trunas_default certificate')
def select_trunas_default_certificate(driver):
    """select trunas_default certificate."""
    element = driver.find_element_by_xpath('//span[text()="Certificate"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)

    assert wait_on_element(driver, 5, xpaths.app_Setup.certificate_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.app_Setup.certificate_Select).click()
    assert wait_on_element(driver, 7, xpaths.app_Setup.truenas_Certificate_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.app_Setup.truenas_Certificate_Option).click()


@then('click save and wait for the installation to finish')
def click_save_and_wait_for_the_installation_to_finish(driver):
    """click save and wait for the installation to finish."""
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
    assert wait_on_element(driver, 20, '//strong[contains(.,"collabora-test")]')
    if is_element_present(driver, '//mat-card[contains(.,"collabora-test")]//span[@class="status active"]') is False:
        assert wait_on_element(driver, 20, '//strong[contains(.,"collabora-test")]')
        assert wait_on_element(driver, 20, '//strong[contains(.,"collabora-test")]', 'clickable')
        driver.find_element_by_xpath('//strong[contains(.,"collabora-test")]').click()
        if wait_on_element(driver, 5, xpaths.popup.please_Wait):
            assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)
        assert wait_on_element(driver, 10, '//div[@class="logo-container" and contains(.,"collabora-test")]')
        assert wait_on_element(driver, 10, '//mat-panel-title[contains(.,"Application Events")]', 'clickable')
        driver.find_element_by_xpath('//mat-panel-title[contains(.,"Application Events")]').click()
        while is_element_present(driver, '//div[(normalize-space(text())="Started container collabora")]') is False:
            time.sleep(2)
            assert wait_on_element(driver, 10, '//span[contains(.,"Refresh Events")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Refresh Events")]').click()
            # make sure Please wait pop up is gone before continuing.
            if wait_on_element(driver, 3, xpaths.popup.please_Wait):
                assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)
        else:
            assert wait_on_element(driver, 10, xpaths.button.close, 'clickable')
            driver.find_element_by_xpath(xpaths.button.close).click()
            assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)
            assert wait_on_element(driver, 500, '//mat-card[contains(.,"collabora-test")]//span[@class="status active"]')
    else:
        assert wait_on_element(driver, 500, '//mat-card[contains(.,"collabora-test")]//span[@class="status active"]')
