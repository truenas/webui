# coding=utf-8
"""Core UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1132.feature', 'Verify Box Cloud Sync task works')
def test_verify_box_cloud_sync_task_works(driver):
    """Verify Box Cloud Sync task works."""
    pass


@given('the browser is open on the TrueNAS URL and logged in')
def the_browser_is_open_on_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open on the TrueNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, click on Storage on the side menu, click on Pools')
def on_the_dashboard_click_on_storage_on_the_side_menu_click_on_pools(driver):
    """on the dashboard, click on Storage on the side menu, click on Pools."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Pools"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('click on the system pool three dots button, select Add Dataset')
def click_on_the_system_pool_three_dots_button_select_add_dataset(driver):
    """click on the system pool three dots button, select Add Dataset."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pools")]')
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__tank"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__tank"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__tank_Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__tank_Add Dataset"]').click()
    assert wait_on_element(driver, 5, '//h4[contains(.,"Name and Options")]')


@then('input box_cloud for Name, select Generic as Share Type, and click Submit')
def input_box_cloud_for_name_select_generic_as_share_type_and_click_submit(driver):
    """input box_cloud for Name, select Generic as Share Type, and click Submit."""
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('box_cloud')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Share Type"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Share Type_Generic"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_Generic"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()


@then('the dataset should be created without error')
def the_dataset_should_be_created_without_error(driver):
    """the dataset should be created without error."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"aws_share")]')


@then('click Tasks on the left sidebar, then click on Cloud Sync Tasks')
def click_tasks_on_the_left_sidebar_then_click_on_cloud_sync_tasks(driver):
    """click Tasks on the left sidebar, then click on Cloud Sync Tasks."""
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Tasks"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Tasks"]').click()
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Cloud Sync Tasks"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Cloud Sync Tasks"]').click()


@then('on the Cloud Sync Tasks, click ADD')
def on_the_cloud_sync_tasks_click_add(driver):
    """on the Cloud Sync Tasks, click ADD."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Cloud Sync Tasks")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__Cloud Sync Tasks_ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__Cloud Sync Tasks_ADD"]').click()


@then('input a description and ensure PULL is selected as the Direction')
def input_a_description_and_ensure_pull_is_selected_as_the_direction(driver):
    """input a description and ensure PULL is selected as the Direction."""
    assert wait_on_element(driver, 5, '//input[@placeholder="Description"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Description"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Description"]').send_keys('My S3 AWS Share')
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"PULL")]')


@then(parsers.parse('select "{selection}" under the Credential drop-down'))
def select_selection_under_the_credential_dropdown(driver, selection):
    """select "selection" under the Credential drop-down."""
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Credential"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Credential"]').click()
    assert wait_on_element(driver, 5, f'//mat-option[@ix-auto="option__Credential_{selection}"]', 'clickable')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Credential_{selection}"]').click()
    time.sleep(0.5)


@then(parsers.parse('select {path} folder, then Under Directory/Files, choose box_cloud'))
def select_the_path_folder_then_under_directoryfiles_choose_box_cloud(driver, path):
    """select {path} folder, then Under Directory/Files, choose box_cloud."""


@then('under Transfer Mode, select COPY, click Save')
def under_transfer_mode_select_copy_click_save(driver):
    """under Transfer Mode, select COPY, click Save."""


@then('click Save, the Box tasks should save without error')
def click_save_the_box_tasks_should_save_without_error(driver):
    """click Save, the Box tasks should save without error."""


@then(parsers.parse('click on {folder1} then click on the test folder'))
def click_on_folder1_then_click_on_the_test_folder(driver):
    """click on {folder1} then click on the test folder."""


@then('expand the task on the NAS UI and click Run Now')
def expand_the_task_on_the_nas_ui_and_click_run_now(driver):
    """expand the task on the NAS UI and click Run Now."""


@then('input <user_name> and <password>, click Sign in')
def input_user_name_and_password_click_sign_in(driver):
    """input <user_name> and <password>, click Sign in."""


@then('on the Box cloud sync task tab, click Edit')
def on_the_box_cloud_sync_task_tab_click_edit(driver):
    """on the Box cloud sync task tab, click Edit."""


@then('on the Box test folder tab, delete all file')
def on_the_box_test_folder_tab_delete_all_file(driver):
    """on the Box test folder tab, delete all file."""


@then('on the Box test folder tab, delete one file')
def on_the_box_test_folder_tab_delete_one_file(driver):
    """on the Box test folder tab, delete one file."""


@then('on the NAS cloud sync task tab, click Edit')
def on_the_nas_cloud_sync_task_tab_click_edit(driver):
    """on the NAS cloud sync task tab, click Edit."""


@then('on the NAS cloud sync task tab, click Run Now')
def on_the_nas_cloud_sync_task_tab_click_run_now(driver):
    """on the NAS cloud sync task tab, click Run Now."""


@then('on the dataset folder, delete a file')
def on_the_dataset_folder_delete_a_file(driver):
    """on the dataset folder, delete a file."""


@then('open a new tab navigate to <box_url> and input <account_id>')
def open_a_new_tab_navigate_to_box_url_and_input_account_id(driver):
    """open a new tab navigate to <box_url> and input <account_id>."""


@then('remove all files from the dataset')
def remove_all_files_from_the_dataset(driver):
    """remove all files from the dataset."""


@then('select PULL as the Direction then under Transfer Mode, select MOVE')
def select_pull_as_the_direction_then_under_transfer_mode_select_move(driver):
    """select PULL as the Direction then under Transfer Mode, select MOVE."""


@then('select PULL as the Direction then under Transfer Mode, select SYNC')
def select_pull_as_the_direction_then_under_transfer_mode_select_sync(driver):
    """select PULL as the Direction then under Transfer Mode, select SYNC."""


@then('select PUSH as the Direction then under Transfer Mode, select COPY')
def select_push_as_the_direction_then_under_transfer_mode_select_copy(driver):
    """select PUSH as the Direction then under Transfer Mode, select COPY."""


@then('select PUSH as the Direction then under Transfer Mode, select MOVE')
def select_push_as_the_direction_then_under_transfer_mode_select_move(driver):
    """select PUSH as the Direction then under Transfer Mode, select MOVE."""


@then('select PUSH as the Direction then under Transfer Mode, select SYNC')
def select_push_as_the_direction_then_under_transfer_mode_select_sync(driver):
    """select PUSH as the Direction then under Transfer Mode, select SYNC."""


@then(parsers.parse('select the {path} folder, and click save'))
def select_the_path_folder_and_click_save(driver, path):
    """select the {path} folder, and click save."""


@then('the Box tasks should save without error')
def the_box_tasks_should_save_without_error(driver):
    """the Box tasks should save without error."""


@then('verify all files are copied from Box are into the dataset')
def verify_all_files_are_copied_from_box_are_into_the_dataset(driver):
    """verify all files are copied from Box are into the dataset."""


@then('verify all files are in the test folder')
def verify_all_files_are_in_the_test_folder(driver):
    """verify all files are in the test folder."""


@then('verify all files are moved from the Box test folder to the dataset')
def verify_all_files_are_moved_from_the_box_test_folder_to_the_dataset(driver):
    """verify all files are moved from the Box test folder to the dataset."""


@then('verify all files are moved from the dataset to the Box test folder')
def verify_all_files_are_moved_from_the_dataset_to_the_box_test_folder(driver):
    """verify all files are moved from the dataset to the Box test folder."""


@then('verify all files are sync to the dataset folder')
def verify_all_files_are_sync_to_the_dataset_folder(driver):
    """verify all files are sync to the dataset folder."""


@then('verify the file is removed from the Box test folder tab')
def verify_the_file_is_removed_from_the_box_test_folder_tab(driver):
    """verify the file is removed from the Box test folder tab."""


@then('verify the file is removed from the dataset folder')
def verify_the_file_is_removed_from_the_dataset_folder(driver):
    """verify the file is removed from the dataset folder."""
