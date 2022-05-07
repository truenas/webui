# coding=utf-8
"""SCALE UI: feature tests."""

import time
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
pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1356.feature', 'Apps Page - Validate adding TrueCommand as a custom app')
def test_apps_page__validate_adding_truecommand_as_a_custom_app():
    """Apps Page - Validate adding TrueCommand as a custom app."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL, and login."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the Dashboard, click on apps')
def on_the_dashboard_click_on_apps(driver):
    """on the Dashboard, click on apps."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Apps"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Apps"]').click()


@then('when the Apps page loads, open available applications')
def when_the_apps_page_loads_open_available_applications(driver):
    """when the Apps page loads, open available applications."""
    assert wait_on_element(driver, 10, '//div[contains(text(),"Available Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Available Applications")]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Available Applications")]')


@then('click Launch Docker Image')
def click_launch_docker_image(driver):
    """click Launch Docker Image."""
    # Wait for Available Applications UI to load
    assert wait_on_element(driver, 120, '//h3[text()="plex"]')
    assert wait_on_element(driver, 10, '//div[contains(.,"plex") and @class="content"]//button', 'clickable')
    # Sleep to make sure that the drop does not disappear
    time.sleep(1)

    assert wait_on_element(driver, 10, '//span[contains(.,"Launch Docker Image")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Launch Docker Image")]').click()
    if wait_on_element(driver, 3, '//*[contains(.,"Please wait")]'):
        assert wait_on_element_disappear(driver, 120, '//*[contains(.,"Please wait")]')


@then('set Application Name')
def set_application_name(driver):
    """set Application Names."""
    assert wait_on_element(driver, 30, '//h3[contains(.,"Launch Docker Image")]')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Application Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Application Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Application Name"]').send_keys('truecommand-test')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Application Name"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Application Name"]').click()


@then('set Container Images')
def set_container_images(driver):
    """set Container Images."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Image repository"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Image repository"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Image repository"]').send_keys('ixsystems/truecommand')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Container Images"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Container Images"]').click()


@then('set Container Entrypoint')
def set_container_entrypoint(driver):
    """set Container Entrypoint."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Container Entrypoint"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Container Entrypoint"]').click()


@then('set Container Environment Variables')
def set_container_environment_variables(driver):
    """set Container Environment Variables."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Container Environment Variables"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Container Environment Variables"]').click()


@then('set Networking')
def set_networking(driver):
    """set Networking."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Networking"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Networking"]').click()


@then('set Port Forwarding List')
def set_port_forwarding_list(driver):
    """set Port Forwarding List."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__add-box_portForwardingList"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__add-box_portForwardingList"]').click()
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Container Port"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Container Port"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Container Port"]').send_keys('80')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Node Port"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Node Port"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Node Port"]').send_keys('9004')

    assert wait_on_element(driver, 7, '//button[@ix-auto="button__add-box_portForwardingList"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__add-box_portForwardingList"]').click()
    assert wait_on_element(driver, 7, '(//input[@ix-auto="input__Container Port"])[2]')
    driver.find_element_by_xpath('(//input[@ix-auto="input__Container Port"])[2]').clear()
    driver.find_element_by_xpath('(//input[@ix-auto="input__Container Port"])[2]').send_keys('443')
    assert wait_on_element(driver, 7, '(//input[@ix-auto="input__Node Port"])[2]')
    driver.find_element_by_xpath('(//input[@ix-auto="input__Node Port"])[2]').clear()
    driver.find_element_by_xpath('(//input[@ix-auto="input__Node Port"])[2]').send_keys('9005')

    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Port Forwarding"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Port Forwarding"]').click()


@then('set Storage')
def set_storage(driver):
    """set Storage."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Storage"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Storage"]').click()


@then('set Workload Details')
def set_workload_details(driver):
    """set Workload Details."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Workload Details"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Workload Details"]').click()


@then('set Scaling/Upgrade Policy')
def set_scalingupgrade_policy(driver):
    """set Scaling/Upgrade Policy."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Scaling/Upgrade Policy"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Scaling/Upgrade Policy"]').click()


@then('set Resource Reservation')
def set_resource_reservation(driver):
    """set Resource Reservation."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Resource Reservation"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Resource Reservation"]').click()


@then('Confirm Options')
def confirm_options(driver):
    """Confirm Options."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()

    assert wait_on_element(driver, 5, '//*[contains(.,"Installing")]')
    assert wait_on_element_disappear(driver, 180, '//*[contains(.,"Installing")]')


@then('confirm installation is successful')
def confirm_installation_is_successful(driver):
    """confirm installation is successful."""
    assert wait_on_element(driver, 180, '//h3[text()="plex"]')
    assert wait_on_element(driver, 10, '//div[contains(.,"plex") and @class="content"]//button', 'clickable')
    time.sleep(1)
    assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
    assert wait_on_element(driver, 120, '//strong[text()="plex-test"]')
    time.sleep(2)
    if is_element_present(driver, '//mat-card[contains(.,"truecommand-test")]//span[@class="status active"]') is False:
        assert wait_on_element(driver, 20, '//strong[contains(.,"truecommand-test")]')
        assert wait_on_element(driver, 20, '//strong[contains(.,"truecommand-test")]', 'clickable')
        driver.find_element_by_xpath('//strong[contains(.,"truecommand-test")]').click()
        if wait_on_element(driver, 3, '//*[contains(.,"Please wait")]'):
            assert wait_on_element_disappear(driver, 60, '//*[contains(.,"Please wait")]')
        # refresh loop
        assert wait_on_element(driver, 10, '//mat-panel-title[contains(.,"Application Events")]', 'clickable')
        driver.find_element_by_xpath('//mat-panel-title[contains(.,"Application Events")]').click()
        while is_element_present(driver, '//div[(normalize-space(text())="Started container ix-chart")]') is False:
            time.sleep(2)
            assert wait_on_element(driver, 10, '//span[contains(.,"Refresh Events")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Refresh Events")]').click()
            # make sure Please wait pop up is gone before continuing.
            if wait_on_element(driver, 3, '//*[contains(.,"Please wait")]'):
                assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Please wait")]')
        else:
            assert wait_on_element(driver, 10, '//span[contains(.,"Close")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Close")]').click()
        assert wait_on_element(driver, 300, '//mat-card[contains(.,"truecommand-test")]//span[@class="status active"]')
    else:
        assert wait_on_element(driver, 300, '//mat-card[contains(.,"truecommand-test")]//span[@class="status active"]')
