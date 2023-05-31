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
import pytest
from pytest_dependency import depends


@pytest.mark.dependency(name='App_Container')
@scenario('features/NAS-T1356.feature', 'Apps Page - Validate adding TrueCommand as a custom app')
def test_apps_page__validate_adding_truecommand_as_a_custom_app():
    """Apps Page - Validate adding TrueCommand as a custom app."""


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
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)


@then('on the Application page click the Launch Docker Image button')
def on_the_application_page_click_the_launch_docker_image_button(driver):
    """on the Application page click the Launch Docker Image button."""
    assert wait_on_element(driver, 10, xpaths.applications.title)
    assert wait_on_element(driver, 10, xpaths.button.launch_Docker_Image, 'clickable')
    driver.find_element_by_xpath(xpaths.button.launch_Docker_Image).click()
    if wait_on_element(driver, 3, xpaths.popup.please_Wait):
        assert wait_on_element_disappear(driver, 120, xpaths.popup.please_Wait)


@then('on the Launch Docker Image box input an Application Name')
def on_the_launch_docker_image_box_input_an_application_name(driver):
    """on the Launch Docker Image box input an Application Name."""
    assert wait_on_element(driver, 30, '//h3[contains(.,"Launch Docker Image")]')
    assert wait_on_element(driver, 7, xpaths.app_Setup.app_Name_Input)
    driver.find_element_by_xpath(xpaths.app_Setup.app_Name_Input).clear()
    driver.find_element_by_xpath(xpaths.app_Setup.app_Name_Input).send_keys('truecommand-test')


@then('under the Container Images input the Image repository And Image Tag')
def under_the_container_images_input_the_image_repository_and_image_tag(driver):
    """under the Container Images input the Image repository And Image Tag."""
    assert wait_on_element(driver, 7, xpaths.app_Setup.image_Repository_input)
    driver.find_element_by_xpath(xpaths.app_Setup.image_Repository_input).clear()
    driver.find_element_by_xpath(xpaths.app_Setup.image_Repository_input).send_keys('ixsystems/truecommand')
    driver.find_element_by_xpath(xpaths.app_Setup.image_Tag_Input).clear()
    driver.find_element_by_xpath(xpaths.app_Setup.image_Tag_Input).send_keys('latest')


@then('under Port Forwarding click Add input 80 in Container Port and 9004 in Node Port')
def under_port_forwarding_click_add_input_80_in_container_port_and_9004_in_node_port(driver):
    """under Port Forwarding click Add input 80 in Container Port and 9004 in Node Port."""
    assert wait_on_element(driver, 7, xpaths.app_Setup.add_Port_Forwading_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.app_Setup.add_Port_Forwading_Button).click()
    assert wait_on_element(driver, 7, xpaths.app_Setup.container_Port_Input)
    driver.find_element_by_xpath(xpaths.app_Setup.container_Port_Input).clear()
    driver.find_element_by_xpath(xpaths.app_Setup.container_Port_Input).send_keys('80')
    assert wait_on_element(driver, 7, xpaths.app_Setup.node_Port_Input)
    driver.find_element_by_xpath(xpaths.app_Setup.node_Port_Input).clear()
    driver.find_element_by_xpath(xpaths.app_Setup.node_Port_Input).send_keys('9004')


@then('click Add again input 443 in Container Port and 9005 in Node Port')
def click_add_again_input_443_in_container_port_and_9005_in_node_port(driver):
    """click Add again input 443 in Container Port and 9005 in Node Port."""
    assert wait_on_element(driver, 7, xpaths.app_Setup.add_Port_Forwading_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.app_Setup.add_Port_Forwading_Button).click()
    assert wait_on_element(driver, 7, xpaths.app_Setup.container_Port2_Input)
    driver.find_element_by_xpath(xpaths.app_Setup.container_Port2_Input).clear()
    driver.find_element_by_xpath(xpaths.app_Setup.container_Port2_Input).send_keys('443')
    assert wait_on_element(driver, 7, xpaths.app_Setup.node_Port2_Input)
    driver.find_element_by_xpath(xpaths.app_Setup.node_Port2_Input).clear()
    driver.find_element_by_xpath(xpaths.app_Setup.node_Port2_Input).send_keys('9005')


@then('click save, wait for the installation to finish')
def click_save_wait_for_the_installation_to_finish(driver):
    """click save, wait for the installation to finish."""
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()

    assert wait_on_element(driver, 5, xpaths.popup.installing)
    assert wait_on_element_disappear(driver, 300, xpaths.popup.installing)


@then('confirm installation is successful and the Docker image is active')
def confirm_installation_is_successful_and_the_app_is_active(driver):
    """confirm installation is successful and the App is active."""
    assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)
    assert wait_on_element(driver, 20, '//strong[contains(.,"truecommand-test")]')

    rsc.Verify_App_Status(driver, "truecommand-test", "ix-chart")
