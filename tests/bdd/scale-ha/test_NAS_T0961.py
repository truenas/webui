# coding=utf-8
"""High Availability (tn-bhyve06) feature tests."""

import pytest
import reusableSeleniumCode as rsc
import time
import xpaths
from function import (
    wait_on_element,
    wait_on_element_disappear,
    get,
    create_Pool
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends


@pytest.mark.dependency(name='System_Dataset', scope='session')
@scenario('features/NAS-T961.feature', 'Creating new pool and set it as System Dataset')
def test_creating_new_pool_and_set_it_as_system_dataset(driver):
    """Creating new pool and set it as System Dataset."""


@given(parsers.parse('the browser is open, navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_vip, request):
    """the browser is open, navigate to "{nas_url}"."""
    depends(request, ["Setup_HA"], scope='session')
    if nas_vip not in driver.current_url:
        driver.get(f"http://{nas_vip}/ui/signin")
        assert wait_on_element(driver, 5, xpaths.login.user_Input)


@when(parsers.parse('the login page appears, enter "{admin_user}" and "{password}"'))
def the_login_page_appear_enter_root_and_password(driver, admin_user, password):
    """the login page appears, enter "{admin_user}" and "{password}"."""
    global ADMIN_PASSWORD, ADMIN_USER
    ADMIN_USER = admin_user
    ADMIN_PASSWORD = password

    rsc.Login_If_Not_On_Dashboard(driver, admin_user, password)


@then('you should see the dashboard and the System Information')
def you_should_see_the_dashboard_and_the_system_information(driver):
    """you should see the dashboard and the System Information."""
    rsc.Verify_The_Dashboard(driver)


@then('navigate to Storage')
def navigate_to_storage(driver):
    """navigate to Storage."""
    assert wait_on_element(driver, 10, xpaths.side_Menu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.storage).click()


# TODO: when Bluefin is replaced by Cobia the steps below need to be refactor.
@then('when the storage page appears, click Create')
def when_the_storage_page_appears_click_create(driver):
    """when the storage page appears, click Create."""
    assert wait_on_element(driver, 7, xpaths.storage.title)
    # assert wait_on_element(driver, 7, '//a[contains(.,"Create Pool")]', 'clickable')
    # driver.find_element_by_xpath('//a[contains(.,"Create Pool")]').click()


@then('the Pools page should open')
def the_pools_page_should_open(driver):
    """the Pools page should open."""
    # assert wait_on_element(driver, 5, '//div[contains(.,"Pools")]')
    pass


@then('the Pool Manager page should open')
def the_pool_manager_page_should_open(driver):
    """the Pool Manager page should open."""
    # assert wait_on_element(driver, 5, xpaths.pool_manager.title)
    # assert wait_on_element_disappear(driver, 120, xpaths.popup.please_Wait)
    pass


@then(parsers.parse('enter {pool_name} for pool name, check the box next to {disk}'))
def enter_dozer_for_pool_name_check_the_box_next_to_sdb(driver, pool_name, disk, nas_vip):
    """enter dozer for pool name, check the box next to sdb."""
    # assert wait_on_element(driver, 7, '//input[@id="pool-manager__name-input-field"]', 'inputable')
    # driver.find_element_by_xpath('//input[@id="pool-manager__name-input-field"]').clear()
    # driver.find_element_by_xpath('//input[@id="pool-manager__name-input-field"]').send_keys(pool_name)
    # driver.find_element_by_xpath(f'//mat-checkbox[@id="pool-manager__disks-{disk}"]').click()
    # if wait_on_element(driver, 3, '//mat-dialog-container[contains(.,"Warning: sd")]'):
    #     assert wait_on_element(driver, 5, '//button[*/text()=" Close "]', 'clickable')
    #     driver.find_element_by_xpath('//button[*/text()=" Close "]').click()
    create_Pool(nas_vip, (ADMIN_USER, ADMIN_PASSWORD), pool_name)


@then('press right arrow under data vdev, click on the Force checkbox')
def press_right_arrow_under_data_vdev_click_on_the_force_checkbox(driver):
    """press right arrow under data vdev, click on the Force checkbox."""
    # assert wait_on_element(driver, 7, '//button[@id="vdev__add-button"]', 'clickable')
    # driver.find_element_by_xpath('//button[@id="vdev__add-button"]').click()
    # assert wait_on_element(driver, 7, '//mat-checkbox[@id="pool-manager__force-submit-checkbox"]')
    # driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__force-submit-checkbox"]').click()
    pass


# This is passed since the confirmation box is missing in Cobia
@then('on the warning box, click Confirm checkbox and click CONTINUE')
def on_the_warning_box_click_confirm_checkbox_and_click_continue(driver):
    """on the warning box, click Confirm checkbox and click CONTINUE."""
    # rsc.Confirm_Single_Disk(driver)
    pass


@then('click Create, click on Confirm checkbox and click CREATE POOL')
def click_create_click_on_confirm_checkbox_and_click_create_pool(driver):
    """click Create, click on Confirm checkbox and click CREATE POOL."""
    # assert wait_on_element(driver, 7, '//button[@name="create-button"]', 'clickable')
    # driver.find_element_by_xpath('//button[@name="create-button"]').click()
    # rsc.Confirm_Creating_Pool(driver)
    pass


@then('Create Pool should appear while the pool is being created')
def create_pool_should_appear_while_the_pool_is_being_created(driver):
    """Create Pool should appear while the pool is being created."""
    # assert wait_on_element_disappear(driver, 60, '//h1[contains(.,"Create Pool")]')
    pass


@then('you should be returned to the list of Pools')
def you_should_be_returned_to_the_list_of_pools(driver):
    """you should be returned to the list of Pools."""
    driver.refresh()
    assert wait_on_element(driver, 7, xpaths.storage.title)


@then(parsers.parse('the {pool_name} pool should be on the Pools list'))
def the_dozer_pool_should_be_on_the_pools_list(driver, pool_name):
    """the "dozer" pool should be on the Pools list."""
    assert wait_on_element(driver, 15, f'//h2[text()="{pool_name}"]')


@then('navigate to System Setting and click Misc')
def navigate_to_system_setting_and_click_misc(driver):
    """navigate to System Setting and click Misc."""
    assert wait_on_element(driver, 7, xpaths.side_Menu.system_Setting, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.system_Setting).click()
    assert wait_on_element(driver, 7, xpaths.side_Menu.advanced, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.advanced).click()


@then('the Advanced page should open')
def the_miscellaneous_page_should_open(driver):
    """the Advanced page should open."""
    assert wait_on_element(driver, 7, xpaths.advanced.title)
    assert wait_on_element(driver, 7, xpaths.advanced.system_Dataset_Pool_Card)


@then('click on System Dataset')
def click_on_system_dataset(driver):
    """click on System Dataset."""
    assert wait_on_element(driver, 7, xpaths.advanced.system_Dataset_Pool_Configure_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.advanced.system_Dataset_Pool_Configure_Button).click()
    rsc.Close_Common_Warning(driver)


@then('the System Dataset page should open')
def the_system_dataset_page_should_open(driver):
    """the System Dataset page should open."""
    assert wait_on_element(driver, 5, xpaths.system_Dataset.title)
    time.sleep(1)


@then(parsers.parse('click on System Dataset Pool select {pool_name}, click Save'))
def click_on_system_dataser_pool_select_dozer_click_Save(driver, pool_name):
    """click on System Dataset Pool select dozer, click Save."""
    assert wait_on_element_disappear(driver, 120, xpaths.progress.progress_Spinner)
    assert wait_on_element(driver, 5, xpaths.system_Dataset.pool_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.system_Dataset.pool_Select).click()
    assert wait_on_element(driver, 5, xpaths.system_Dataset.pool_Option(pool_name))
    driver.find_element_by_xpath(xpaths.system_Dataset.pool_Option(pool_name)).click()
    assert wait_on_element(driver, 30, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('Please wait should appear while settings are being applied')
def please_wait_should_appear_while_settings_are_being_applied(driver):
    """Please wait should appear while settings are being applied."""
    # assert need to be added after the UI get fix.
    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)
    assert wait_on_element_disappear(driver, 20, xpaths.advanced.system_Dataset_Pool_Pool('tank'))
    assert wait_on_element(driver, 5, xpaths.advanced.system_Dataset_Pool_Pool('dozer'))


@then('navigate to the dashboard')
def navigate_to_dashboard(driver):
    """navigate to The dashboard."""
    rsc.Click_On_Element(driver, xpaths.side_Menu.old_dashboard)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)


@then('refresh and wait for the second node to be up')
def refresh_and_wait_for_the_second_node_to_be_up(driver):
    """refresh and wait for the second node to be up"""
    assert wait_on_element(driver, 45, xpaths.toolbar.ha_Disabled)
    assert wait_on_element(driver, 180, xpaths.toolbar.ha_Enabled)
    # 5 second to let the system get ready for the next step.
    time.sleep(5)


@then('verify the system dataset is dozer on the active node')
def verify_the_system_dataset_is_dozer_on_the_active_node(nas_vip):
    """verify the system dataset is dozer on the active node."""
    results = get(nas_vip, '/systemdataset/', (ADMIN_USER, ADMIN_PASSWORD))
    assert results.status_code == 200, results.text
    assert results.json()['pool'] == 'dozer', results.text


@then('press Initiate Failover and confirm')
def press_initiate_failover_and_confirm(driver):
    """press Initiate Failover and confirm."""
    time.sleep(20)
    rsc.Trigger_Failover(driver)

    rsc.Confirm_Failover(driver)


@then('wait for the login and the HA enabled status than verify the system dataset and login')
def wait_for_the_login_and_the_ha_enabled_status_than_verify_the_system_dataset_and_login(driver, nas_vip):
    """wait for the login and the HA enabled status than verify the system dataset and login."""
    wait_on_element(driver, 180, xpaths.login.user_Input)
    driver.refresh()
    # Do not assert wait_on_element(driver, 180, xpaths.login.ha_Status_Enable) we need to verify the system dataset.
    wait_on_element(driver, 180, xpaths.login.ha_Status_Enable)

    results = get(nas_vip, '/systemdataset/', (ADMIN_USER, ADMIN_PASSWORD))
    assert results.status_code == 200, results.text
    assert results.json()['pool'] == 'dozer', results.text

    rsc.Login(driver, ADMIN_USER, ADMIN_PASSWORD)
    rsc.Verify_The_Dashboard(driver)

    # Make sure HA is enabled before going forward
    assert wait_on_element(driver, 120, xpaths.toolbar.ha_Enabled)
    rsc.License_Agrement(driver)
    time.sleep(5)


@then('verify the system dataset is dozer on the active node after failover')
def verify_the_system_dataset_is_dozer_on_the_active_node_after_failover(nas_vip):
    """verify the system dataset is dozer on the active node after failover."""
    results = get(nas_vip, '/systemdataset/', ('root', ADMIN_PASSWORD))
    assert results.status_code == 200, results.text
    assert results.json()['pool'] == 'dozer', results.text
