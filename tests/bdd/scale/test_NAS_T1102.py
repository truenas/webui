# coding=utf-8
"""SCALE UI: feature tests."""

import pytest
import reusableSeleniumCode as rsc
import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    create_Pool
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when
)
from pytest_dependency import depends


@pytest.mark.dependency(name='system_pool')
@scenario('features/NAS-T1102.feature', 'Creating new pool and set it as a system dataset')
def test_creating_new_pool_and_set_it_as_a_system_dataset():
    """Creating new pool and set it as a system dataset."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['tank_pool'], scope='session')
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
        assert wait_on_element(driver, 10, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()


@when('you should be on the dashboard, click Storage on the side menu')
def you_should_be_on_the_dashboard_click_storage_on_the_side_menu(driver):
    """you should be on the dashboard, click Storage on the side menu."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 10, xpaths.side_Menu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.storage).click()


# TODO: when Bluefin is replaced by Cobia the steps below need to be refactor.
@when('the pools page appears click create pool')
def the_pools_page_appears_click_create_pool(driver):
    """the pools page appears click create pool."""
    assert wait_on_element(driver, 10, xpaths.storage.title)
    # assert wait_on_element(driver, 10, xpaths.storage.create_Pool_Button, 'clickable')
    # driver.find_element_by_xpath(xpaths.storage.create_Pool_Button).click()


@then('the Pool Manager appears, enter the system for pool name')
def the_pool_manager_appears_enter_the_system_for_pool_name(driver, nas_ip, root_password):
    """the Pool Manager appears, enter the system for pool name."""
    # assert wait_on_element(driver, 7, xpaths.pool_manager.title)
    # assert wait_on_element_disappear(driver, 120, xpaths.popup.please_Wait)
    # assert wait_on_element(driver, 10, xpaths.pool_manager.name_Input, 'inputable')
    # driver.find_element_by_xpath(xpaths.pool_manager.name_Input).send_keys('system')
    create_Pool(nas_ip, ('root', root_password), 'system')


@then('click sdc checkbox, press the right arrow under Data VDevs')
def click_sdc_checkbox_press_the_right_arrow_under_data_vdevs(driver):
    """click sdc checkbox, press the right arrow under Data VDevs."""
    # assert wait_on_element(driver, 7, xpaths.pool_manager.first_Disk_Checkbox, 'clickable')
    # driver.find_element_by_xpath(xpaths.pool_manager.first_Disk_Checkbox).click()
    # assert wait_on_element(driver, 5, xpaths.pool_manager.vdev_Add_Button, 'clickable')
    # driver.find_element_by_xpath(xpaths.pool_manager.vdev_Add_Button).click()
    # assert wait_on_element(driver, 7, xpaths.pool_manager.force_Checkbox, 'clickable')
    # driver.find_element_by_xpath(xpaths.pool_manager.force_Checkbox).click()


@then('click create, On the Warning widget, click confirm checkbox, click CREATE POOL')
def click_create_on_the_warning_widget_click_confirm_checkbox_click_create_pool(driver):
    """click create, On the Warning widget, click confirm checkbox, click CREATE POOL."""
    # rsc.Confirm_Single_Disk(driver)
    # assert wait_on_element(driver, 5, xpaths.pool_manager.create_Button, 'clickable')
    # driver.find_element_by_xpath(xpaths.pool_manager.create_Button).click()
    # rsc.Confirm_Creating_Pool(driver)


@then('Create pool should appear while pool is being created')
def create_pool_should_appear_while_pool_is_being_created(driver):
    """Create pool should appear while pool is being created."""
    # assert wait_on_element(driver, 10, xpaths.pool_manager.create_Pool_Popup)
    # assert wait_on_element_disappear(driver, 120, xpaths.pool_manager.create_Pool_Popup)
    driver.refresh()
    assert wait_on_element(driver, 10, xpaths.storage.title)


@then('the pools system should appear in the list')
def the_pools_system_should_appear_in_the_list(driver):
    """the pools system should appear in the list."""
    assert wait_on_element(driver, 15, '//h2[text()="system"]')


@then('navigate to System Setting and click Advanced to open the Advanced page should open')
def navigate_to_system_setting_and_click_advanced_to_open_the_advanced_page_should_open(driver):
    """navigate to System Setting and click Advanced to open the Advanced page should open."""
    assert wait_on_element(driver, 7, xpaths.side_Menu.system_Setting, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.system_Setting).click()
    assert wait_on_element(driver, 7, xpaths.side_Menu.advanced, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.advanced).click()


@then('click on System Dataset Configure button and close the popup')
def click_on_system_dataset_configure_button_and_close_the_popup(driver):
    """click on System Dataset Configure button and close the popup."""
    assert wait_on_element(driver, 7, xpaths.advanced.title)
    assert wait_on_element(driver, 7, xpaths.advanced.system_Dataset_Pool_Card)
    assert wait_on_element(driver, 7, xpaths.advanced.system_Dataset_Pool_Configure_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.advanced.system_Dataset_Pool_Configure_Button).click()
    rsc.Close_Common_Warning(driver)


@then('click on System Dataset Pool select system, click Save')
def click_on_system_dataset_pool_select_system_click_save(driver):
    """click on System Dataset Pool select system, click Save."""
    assert wait_on_element(driver, 5, xpaths.system_Dataset.title)
    time.sleep(1)
    assert wait_on_element_disappear(driver, 120, xpaths.progress.progress_Spinner)
    assert wait_on_element(driver, 5, xpaths.system_Dataset.pool_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.system_Dataset.pool_Select).click()
    assert wait_on_element(driver, 5, xpaths.system_Dataset.pool_Option('system'))
    driver.find_element_by_xpath(xpaths.system_Dataset.pool_Option('system')).click()
    assert wait_on_element(driver, 30, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('Please wait should appear while settings are being applied')
def please_wait_should_appear_while_settings_are_being_applied(driver):
    """Please wait should appear while settings are being applied."""
    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)
    assert wait_on_element_disappear(driver, 20, xpaths.advanced.system_Dataset_Pool_Pool('tank'))
    assert wait_on_element(driver, 5, xpaths.advanced.system_Dataset_Pool_Pool('system'))
