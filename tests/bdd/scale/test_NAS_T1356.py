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
    when,

)
import pytest
from pytest_dependency import depends
pytestmark = [pytest.mark.debug_test]


@pytest.mark.dependency(name='App_Container')
@scenario('features/NAS-T1356.feature', 'Apps Page - Validate adding TrueCommand as a custom app')
def test_apps_page__validate_adding_truecommand_as_a_custom_app():
    """Apps Page - Validate adding TrueCommand as a custom app."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password, request):
    """the browser is open, navigate to the SCALE URL, and login."""
    #depends(request, ['App_readd_pool'], scope='session')
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
        assert wait_on_element(driver, 5, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('on the Dashboard, click Apps on the side menu')
def on_the_dashboard_click_apps_on_the_side_menu(driver):
    """on the Dashboard, click Apps on the side menu."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 10, xpaths.sideMenu.apps, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.apps).click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)


@then('on the Application page click the Launch Docker Image button')
def on_the_application_page_click_the_launch_docker_image_button(driver):
    """on the Application page click the Launch Docker Image button."""
    assert wait_on_element(driver, 10, xpaths.applications.title)
    assert wait_on_element(driver, 10, '//span[contains(.,"Launch Docker Image")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Launch Docker Image")]').click()
    if wait_on_element(driver, 3, xpaths.popup.pleaseWait):
        assert wait_on_element_disappear(driver, 120, xpaths.popup.pleaseWait)


@then('on the Launch Docker Image box input an Application Name')
def on_the_launch_docker_image_box_input_an_application_name(driver):
    """on the Launch Docker Image box input an Application Name."""
    assert wait_on_element(driver, 30, '//h3[contains(.,"Launch Docker Image")]')
    assert wait_on_element(driver, 7, xpaths.appSetup.appName_input)
    driver.find_element_by_xpath(xpaths.appSetup.appName_input).clear()
    driver.find_element_by_xpath(xpaths.appSetup.appName_input).send_keys('truecommand-test')


@then('under the Container Images input the Image repository And Image Tag')
def under_the_container_images_input_the_image_repository_and_image_tag(driver):
    """under the Container Images input the Image repository And Image Tag."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Image repository"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Image repository"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Image repository"]').send_keys('ixsystems/truecommand')


@then('under Port Forwarding click Add input 80 in Container Port and 9004 in Node Port')
def under_port_forwarding_click_add_input_80_in_container_port_and_9004_in_node_port(driver):
    """under Port Forwarding click Add input 80 in Container Port and 9004 in Node Port."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__add-box_portForwardingList"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__add-box_portForwardingList"]').click()
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Container Port"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Container Port"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Container Port"]').send_keys('80')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Node Port"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Node Port"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Node Port"]').send_keys('9004')


@then('click Add again input 443 in Container Port and 9005 in Node Port')
def click_add_again_input_443_in_container_port_and_9005_in_node_port(driver):
    """click Add again input 443 in Container Port and 9005 in Node Port."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__add-box_portForwardingList"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__add-box_portForwardingList"]').click()
    assert wait_on_element(driver, 7, '(//input[@ix-auto="input__Container Port"])[2]')
    driver.find_element_by_xpath('(//input[@ix-auto="input__Container Port"])[2]').clear()
    driver.find_element_by_xpath('(//input[@ix-auto="input__Container Port"])[2]').send_keys('443')
    assert wait_on_element(driver, 7, '(//input[@ix-auto="input__Node Port"])[2]')
    driver.find_element_by_xpath('(//input[@ix-auto="input__Node Port"])[2]').clear()
    driver.find_element_by_xpath('(//input[@ix-auto="input__Node Port"])[2]').send_keys('9005')


@then('click save, wait for the installation to finish')
def click_save_wait_for_the_installation_to_finish(driver):
    """click save, wait for the installation to finish."""
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()

    assert wait_on_element(driver, 5, xpaths.popup.installing)
    assert wait_on_element_disappear(driver, 120, xpaths.popup.installing)


@then('confirm installation is successful and the Docker image is active')
def confirm_installation_is_successful_and_the_app_is_active(driver):
    """confirm installation is successful and the App is active."""
    assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)
    assert wait_on_element(driver, 20, '//strong[contains(.,"truecommand-test")]')
    if is_element_present(driver, '//mat-card[contains(.,"truecommand-test")]//span[@class="status active"]') is False:
        assert wait_on_element(driver, 20, '//strong[contains(.,"truecommand-test")]', 'clickable')
        driver.find_element_by_xpath('//strong[contains(.,"truecommand-test")]').click()
        if wait_on_element(driver, 3, xpaths.popup.pleaseWait):
            assert wait_on_element_disappear(driver, 60, xpaths.popup.pleaseWait)
        # refresh loop
        assert wait_on_element(driver, 10, '//mat-panel-title[contains(.,"Application Events")]', 'clickable')
        driver.find_element_by_xpath('//mat-panel-title[contains(.,"Application Events")]').click()
        while is_element_present(driver, '//div[(normalize-space(text())="Started container ix-chart")]') is False:
            time.sleep(2)
            assert wait_on_element(driver, 10, '//span[contains(.,"Refresh Events")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Refresh Events")]').click()
            # make sure Please wait pop up is gone before continuing.
            if wait_on_element(driver, 3, xpaths.popup.pleaseWait):
                assert wait_on_element_disappear(driver, 10, xpaths.popup.pleaseWait)
        else:
            assert wait_on_element(driver, 10, xpaths.button.close, 'clickable')
            driver.find_element_by_xpath(xpaths.button.close).click()
            assert wait_on_element_disappear(driver, 40, xpaths.progress.spinner)
        assert wait_on_element(driver, 500, '//mat-card[contains(.,"truecommand-test")]//span[@class="status active"]')
    else:
        assert wait_on_element(driver, 500, '//mat-card[contains(.,"truecommand-test")]//span[@class="status active"]')
