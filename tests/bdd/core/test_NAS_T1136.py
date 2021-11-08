# coding=utf-8
"""Core UI feature tests."""

import time
from selenium.webdriver import ActionChains
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


@scenario('features/NAS-T1136.feature', 'Verify Dropbox Cloud Sync task works')
def test_verify_dropox_cloud_sync_task_works():
    """Verify Dropox Cloud Sync task works."""
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
    if wait_on_element(driver, 5, '//div[contains(.,"Looking for help?")]'):
        assert wait_on_element(driver, 10, '//button[@ix-auto="button__CLOSE"]')
        driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Pools"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('click on the system pool three dots button, select Add Dataset')
def click_on_the_system_pool_three_dots_button_select_add_dataset(driver):
    """click on the system pool three dots button, select Add Dataset."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pools")]')
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__system"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__system"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__system_Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__system_Add Dataset"]').click()
    assert wait_on_element(driver, 5, '//h4[contains(.,"Name and Options")]')


@then('input dropbox_cloud for Name, select Generic as Share Type and click Submit')
def input_dropbox_cloud_for_name_select_generic_as_share_type_and_click_submit(driver):
    """input dropbox_cloud for Name, select Generic as Share Type, and click Submit."""
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('dropbox_cloud')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Share Type"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Share Type_Generic"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_Generic"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()


@then('the dataset should be created without error')
def the_dataset_should_be_created_without_error(driver):
    """the dataset should be created without error."""
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"dropbox_cloud")]')


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
    driver.find_element_by_xpath('//input[@placeholder="Description"]').send_keys('My Dropbox task')
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"PULL")]')


@then(parsers.parse('select "{selection}" under the Credential drop-down'))
def select_selection_under_the_credential_dropdown(driver, selection):
    """select "selection" under the Credential drop-down."""
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Credential"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Credential"]').click()
    assert wait_on_element(driver, 5, f'//mat-option[@ix-auto="option__Credential_{selection}"]', 'clickable')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Credential_{selection}"]').click()
    time.sleep(0.5)


@then(parsers.parse('select {path} folder, then Under Directory/Files, choose dropbox_cloud'))
def select_the_path_folder_then_under_directoryfiles_choose_dropbox_cloud(driver, path):
    """select {path} folder, then Under Directory/Files, choose dropbox_cloud."""
    assert wait_on_element(driver, 5, '//input[@placeholder="Folder"]')
    driver.find_element_by_xpath('//input[@placeholder="Folder"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Folder"]').send_keys(path)
    assert wait_on_element(driver, 5, '//input[@placeholder="Directory/Files"]')
    driver.find_element_by_xpath('//input[@placeholder="Directory/Files"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Directory/Files"]').send_keys('/mnt/system/dropbox_cloud')


@then('under Transfer Mode, select COPY, click Save')
def under_transfer_mode_select_copy_click_save(driver):
    """under Transfer Mode, select COPY, click Save."""
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"COPY")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')


@then('the Dropbox tasks should save without error')
def the_dropbox_tasks_should_save_without_error(driver):
    """the Dropbox tasks should save without error."""
    assert wait_on_element(driver, 5, '//div[contains(text(),"My Dropbox task")]')


@then('expand the task on the NAS UI and click Run Now')
def expand_the_task_on_the_nas_ui_and_click_run_now(driver):
    """expand the task on the NAS UI and click Run Now."""
    assert wait_on_element(driver, 5, '//a[@ix-auto="expander__My Dropbox task"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="expander__My Dropbox task"]').click()
    assert wait_on_element(driver, 5, '//button[@id="action_button___run_now"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="action_button___run_now"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 60, '//button[@id="My Dropbox task_Status-button" and contains(.,"SUCCESS")]')
    time.sleep(5)


@then('verify all files are copied from Dropbox are into the dataset')
def verify_all_files_are_copied_from_dropbox_are_into_the_dataset(driver, nas_ip):
    """verify all files are copied from Dropbox are into the dataset."""
    cmd = 'test -f /mnt/system/dropbox_cloud/Gloomy_Forest_wallpaper_ForWallpapercom.jpg'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True, results['output']
    cmd = 'test -f /mnt/system/dropbox_cloud/Explaining_BSD.pdf'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True, results['output']
    cmd = 'test -f /mnt/system/dropbox_cloud/music/Mr_Smith_Pequeñas_Guitarras.mp3'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True, results['output']


@then('on the NAS cloud sync task tab, click Edit')
def on_the_nas_cloud_sync_task_tab_click_edit(driver):
    """on the NAS cloud sync task tab, click Edit."""
    driver.switch_to.window(driver.window_handles[0])
    time.sleep(1)
    assert wait_on_element(driver, 5, '//div[contains(text(),"My Dropbox task")]')
    if not wait_on_element(driver, 2, '//button[@ix-auto="button___edit"]', 'clickable'):
        assert wait_on_element(driver, 5, '//a[@ix-auto="expander__My Dropbox task"]', 'clickable')
        driver.find_element_by_xpath('//a[@ix-auto="expander__My Dropbox task"]').click()
    time.sleep(0.5)
    assert wait_on_element(driver, 5, '//button[@ix-auto="button___edit"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button___edit"]').click()
    assert wait_on_element(driver, 5, '//h4[contains(.,"Transfer")]')
    # give time to the system to be ready.
    time.sleep(1)


@then('select PUSH as the Direction then under Transfer Mode, select COPY')
def select_push_as_the_direction_then_under_transfer_mode_select_copy(driver):
    """select PUSH as the Direction then under Transfer Mode, select COPY."""
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"PULL")]')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Direction"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Direction"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Direction_PUSH"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Direction_PUSH"]').click()
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"PUSH")]')
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"COPY")]')


@then(parsers.parse('select the {path} folder, and click save'))
def select_the_path_folder_and_click_save(driver, path):
    """select the {path} folder, and click save."""
    assert wait_on_element(driver, 5, '//input[@placeholder="Folder"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Folder"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Folder"]').send_keys(path)
    assert wait_on_element(driver, 5, '//button[@id="save_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="save_button"]').click()
    assert wait_on_element_disappear(driver, 30, '//h1[contains(.,"Please wait")]')


@then('open a new tab navigate to <box_url>')
def open_a_new_tab_navigate_to_dropbox_url_and_input_account_id(driver, box_url):
    """open a new tab navigate to <box_url> and input <account_id>."""
    driver.execute_script("window.open();")
    driver.switch_to.window(driver.window_handles[1])
    driver.get(box_url)
    time.sleep(2)


@then('input <user_name> and <password>, click Sign in')
def input_user_name_and_password_click_sign_in(driver, user_name, password):
    """input <user_name> and <password>, click Sign in."""
    if wait_on_element(driver, 3, '//img[@class="dropbox-logo__type"]'):
        assert wait_on_element(driver, 5, '//button[contains(.,"Sign in with Google")]', 'clickable')
        driver.find_element_by_xpath('//button[contains(.,"Sign in with Google")]').click()
        driver.switch_to.window(driver.window_handles[2])
        assert wait_on_element(driver, 10, '//div[text()="Sign in with Google"]')
        assert wait_on_element(driver, 5, '//span[text()="Sign in"]')
        assert wait_on_element(driver, 5, '//input[@id="identifierId"]', 'inputable')
        driver.find_element_by_xpath('//input[@id="identifierId"]').send_keys(user_name)
        time.sleep(1)
        assert wait_on_element(driver, 5, '//button[contains(.,"Next")]', 'clickable')
        driver.find_element_by_xpath('//button[contains(.,"Next")]').click()
        assert wait_on_element(driver, 10, '//div[text()="Sign in with Google"]')
        assert wait_on_element(driver, 5, '//span[text()="Welcome"]')
        assert wait_on_element(driver, 5, '//input[@type="password"]', 'inputable')
        driver.find_element_by_xpath('//input[@type="password"]').send_keys(password)
        time.sleep(1)
        assert wait_on_element(driver, 5, '//button[contains(.,"Next")]', 'clickable')
        driver.find_element_by_xpath('//button[contains(.,"Next")]').click()
        while len(driver.window_handles) != 2:
            time.sleep(1)
        driver.switch_to.window(driver.window_handles[1])
    assert wait_on_element(driver, 15, '//nav[contains(.,"Dropbox")]//span[text()="Dropbox"]')


@then(parsers.parse('click on {folder1} then click on the test folder'))
def click_on_folder1_then_click_on_the_test_folder(driver, folder1):
    """click on {folder1} then click on the test folder."""
    assert wait_on_element(driver, 5, f'//span[text()="{folder1}"]', 'clickable')
    driver.find_element_by_xpath(f'//span[text()="{folder1}"]').click()
    assert wait_on_element(driver, 5, f'//nav[contains(.,"{folder1}")]//span[text()="{folder1}"]')
    assert wait_on_element(driver, 5, '//span[text()="test"]', 'clickable')
    driver.find_element_by_xpath('//span[text()="test"]').click()


@then('verify all files are in the test folder')
def verify_all_files_are_in_the_test_folder(driver):
    """verify all files are in the test folder."""
    assert wait_on_element(driver, 5, '//nav[contains(.,"test")]//span[text()="test"]')
    assert wait_on_element(driver, 5, '//span[text()="Explaining_BSD.pdf"]', 'clickable')
    assert wait_on_element(driver, 5, '//span[text()="Gloomy_Forest_wallpaper_ForWallpapercom.jpg"]', 'clickable')
    assert wait_on_element(driver, 5, '//span[text()="music"]', 'clickable')
    driver.find_element_by_xpath('//span[text()="music"]').click()
    assert wait_on_element(driver, 5, '//nav[contains(.,"music")]//span[text()="music"]')
    assert wait_on_element(driver, 5, '//span[text()="Mr_Smith_Pequeñas_Guitarras.mp3"]', 'clickable')
    assert wait_on_element(driver, 5, '//nav[contains(.,"test")]//a[contains(.,"test")]', 'clickable')
    driver.find_element_by_xpath('//nav[contains(.,"test")]//a[contains(.,"test")]').click()


@then('remove all files from the dataset')
def remove_all_files_from_the_dataset(driver, nas_ip):
    """remove all files from the dataset."""
    cmd = 'rm -f /mnt/system/dropbox_cloud/Gloomy_Forest_wallpaper_ForWallpapercom.jpg'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True, results['output']
    cmd = 'rm -f /mnt/system/dropbox_cloud/Explaining_BSD.pdf'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True, results['output']
    cmd = 'rm -rf /mnt/system/dropbox_cloud/music'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True, results['output']


@then('select PULL as the Direction then under Transfer Mode, select MOVE')
def select_pull_as_the_direction_then_under_transfer_mode_select_move(driver):
    """select PULL as the Direction then under Transfer Mode, select MOVE."""
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"PUSH")]')
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"COPY")]')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Direction"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Direction"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Direction_PULL"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Direction_PULL"]').click()
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"PULL")]')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Transfer Mode"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Transfer Mode"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Transfer Mode_MOVE"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Transfer Mode_MOVE"]').click()
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"MOVE")]')


@then('click Save, the Dropbox tasks should save without error')
def click_save_the_dropbox_tasks_should_save_without_error(driver):
    """click Save, the Dropbox tasks should save without error."""
    assert wait_on_element(driver, 5, '//button[@id="save_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="save_button"]').click()
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 5, '//div[contains(text(),"My Dropbox task")]')


@then('verify all files are moved from the Dropbox test folder to the dataset')
def verify_all_files_are_moved_from_the_dropbox_test_folder_to_the_dataset(driver, nas_ip):
    """verify all files are moved from the Dropbox test folder to the dataset."""
    driver.switch_to.window(driver.window_handles[1])
    time.sleep(0.5)
    driver.refresh()
    time.sleep(1)
    assert wait_on_element(driver, 5, '//nav[contains(.,"test")]//span[text()="test"]')
    assert wait_on_element(driver, 7, '//span[text()="music"]')
    assert not is_element_present(driver, '//span[text()="Explaining_BSD.pdf"]')
    assert not is_element_present(driver, '//span[text()="Gloomy_Forest_wallpaper_ForWallpapercom.jpg"]')
    driver.find_element_by_xpath('//span[text()="music"]').click()
    assert wait_on_element(driver, 5, '//nav[contains(.,"music")]//span[text()="music"]')
    assert not is_element_present(driver, '//span[text()="Mr_Smith_Pequeñas_Guitarras.mp3"]')
    assert wait_on_element(driver, 5, '//nav[contains(.,"test")]//a[contains(.,"test")]', 'clickable')
    driver.find_element_by_xpath('//nav[contains(.,"test")]//a[contains(.,"test")]').click()
    cmd = 'test -f /mnt/system/dropbox_cloud/Gloomy_Forest_wallpaper_ForWallpapercom.jpg'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True, results['output']
    cmd = 'test -f /mnt/system/dropbox_cloud/Explaining_BSD.pdf'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True, results['output']
    cmd = 'test -f /mnt/system/dropbox_cloud/music/Mr_Smith_Pequeñas_Guitarras.mp3'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True, results['output']


@then('select PUSH as the Direction then under Transfer Mode, select MOVE')
def select_push_as_the_direction_then_under_transfer_mode_select_move(driver):
    """select PUSH as the Direction then under Transfer Mode, select MOVE."""
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"PULL")]')
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"MOVE")]')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Direction"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Direction"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Direction_PUSH"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Direction_PUSH"]').click()
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"PUSH")]')
    assert wait_on_element(driver, 5, '//h1[contains(.,"Transfer Mode Reset")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"COPY")]')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Transfer Mode"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Transfer Mode"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Transfer Mode_MOVE"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Transfer Mode_MOVE"]').click()
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"MOVE")]')


@then('verify all files are moved from the dataset to the Dropbox test folder')
def verify_all_files_are_moved_from_the_dataset_to_the_dropbox_test_folder(driver, nas_ip):
    """verify all files are moved from the dataset to the Dropbox test folder."""
    cmd = 'test -f /mnt/system/dropbox_cloud/Gloomy_Forest_wallpaper_ForWallpapercom.jpg'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is False, results['output']
    cmd = 'test -f /mnt/system/dropbox_cloud/Explaining_BSD.pdf'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is False, results['output']
    cmd = 'test -f /mnt/system/dropbox_cloud/music/Mr_Smith_Pequeñas_Guitarras.mp3'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is False, results['output']
    driver.switch_to.window(driver.window_handles[1])
    time.sleep(2)
    driver.refresh()
    time.sleep(2)
    assert wait_on_element(driver, 5, '//nav[contains(.,"test")]//span[text()="test"]')
    assert wait_on_element(driver, 7, '//span[text()="Explaining_BSD.pdf"]')
    assert wait_on_element(driver, 7, '//span[text()="Gloomy_Forest_wallpaper_ForWallpapercom.jpg"]')
    assert wait_on_element(driver, 7, '//span[text()="music"]', 'clickable')
    driver.find_element_by_xpath('//span[text()="music"]').click()
    assert wait_on_element(driver, 5, '//nav[contains(.,"music")]//span[text()="music"]')
    assert wait_on_element(driver, 5, '//span[text()="Mr_Smith_Pequeñas_Guitarras.mp3"]')
    assert wait_on_element(driver, 5, '//nav[contains(.,"test")]//a[contains(.,"test")]', 'clickable')
    driver.find_element_by_xpath('//nav[contains(.,"test")]//a[contains(.,"test")]').click()


@then('select PULL as the Direction then under Transfer Mode, select SYNC')
def select_pull_as_the_direction_then_under_transfer_mode_select_sync(driver):
    """select PULL as the Direction then under Transfer Mode, select SYNC."""
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"PUSH")]')
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"MOVE")]')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Direction"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Direction"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Direction_PULL"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Direction_PULL"]').click()
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"PULL")]')
    assert wait_on_element(driver, 5, '//h1[contains(.,"Transfer Mode Reset")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"COPY")]')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Transfer Mode"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Transfer Mode"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Transfer Mode_SYNC"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Transfer Mode_SYNC"]').click()
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"SYNC")]')


@then('verify all files are sync to the dataset folder')
def verify_all_files_are_sync_to_the_dataset_folder(driver, nas_ip):
    """verify all files are sync to the dataset folder."""
    cmd = 'test -f /mnt/system/dropbox_cloud/Gloomy_Forest_wallpaper_ForWallpapercom.jpg'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True, results['output']
    cmd = 'test -f /mnt/system/dropbox_cloud/Explaining_BSD.pdf'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True, results['output']
    cmd = 'test -f /mnt/system/dropbox_cloud/music/Mr_Smith_Pequeñas_Guitarras.mp3'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True, results['output']


@then('on the Dropbox test folder tab, delete one file')
def on_the_dropbox_test_folder_tab_delete_one_file(driver):
    """on the Dropbox test folder tab, delete one file."""
    driver.switch_to.window(driver.window_handles[1])
    time.sleep(1)
    assert wait_on_element(driver, 5, '//nav[contains(.,"test")]//span[text()="test"]')
    assert wait_on_element(driver, 5, '//span[text()="Gloomy_Forest_wallpaper_ForWallpapercom.jpg"]', 'clickable')
    assert wait_on_element(driver, 5, '//span[text()="music"]', 'clickable')
    assert wait_on_element(driver, 5, '//span[text()="Explaining_BSD.pdf"]', 'clickable')
    action = ActionChains(driver)
    action.move_to_element(driver.find_element_by_xpath('//tr[contains(.,"Gloomy_Forest_wallpaper_ForWallpapercom.jpg")]')).perform()
    assert wait_on_element(driver, 5, '//button[@aria-label="More menu"]', 'clickable')
    driver.find_element_by_xpath('//button[@aria-label="More menu"]').click()
    assert wait_on_element(driver, 5, '//div[text()="Delete"]', 'clickable')
    driver.find_element_by_xpath('//div[text()="Delete"]').click()
    assert wait_on_element(driver, 5, '//h2[contains(.,"Delete file?")]')
    assert wait_on_element(driver, 5, '//button[contains(.,"Delete")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Delete")]').click()
    assert wait_on_element_disappear(driver, 10, '//span[text()="Gloomy_Forest_wallpaper_ForWallpapercom.jpg"]')


@then('on the NAS cloud sync task tab, click Run Now')
def on_the_nas_cloud_sync_task_tab_click_run_now(driver):
    """on the NAS cloud sync task tab, click Run Now."""
    driver.switch_to.window(driver.window_handles[0])
    assert wait_on_element(driver, 5, '//div[contains(text(),"My Dropbox task")]')
    assert wait_on_element(driver, 5, '//button[@id="action_button___run_now"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="action_button___run_now"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 60, '//button[@id="My Dropbox task_Status-button" and contains(.,"SUCCESS")]')
    # give time to the system to be ready.
    time.sleep(5)


@then('verify the file is removed from the dataset folder')
def verify_the_file_is_removed_from_the_dataset_folder(driver, nas_ip):
    """verify the file is removed from the dataset folder."""
    cmd = 'test -f /mnt/system/dropbox_cloud/Gloomy_Forest_wallpaper_ForWallpapercom.jpg'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is False, results['output']
    cmd = 'test -f /mnt/system/dropbox_cloud/Explaining_BSD.pdf'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True, results['output']
    cmd = 'test -f /mnt/system/dropbox_cloud/music/Mr_Smith_Pequeñas_Guitarras.mp3'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True, results['output']


@then('on the Dropbox test folder tab, delete all file')
def on_the_dropbox_test_folder_tab_delete_all_file(driver):
    """on the Dropbox test folder tab, delete all file."""
    driver.switch_to.window(driver.window_handles[1])
    time.sleep(1)
    assert wait_on_element(driver, 5, '//nav[contains(.,"test")]//span[text()="test"]')
    assert wait_on_element(driver, 5, '//span[text()="music"]', 'clickable')
    assert wait_on_element(driver, 5, '//span[text()="Explaining_BSD.pdf"]', 'clickable')
    action = ActionChains(driver)
    action.move_to_element(driver.find_element_by_xpath('//tr[contains(.,"Explaining_BSD.pdf")]')).perform()
    assert wait_on_element(driver, 5, '//button[@aria-label="More menu"]', 'clickable')
    driver.find_element_by_xpath('//button[@aria-label="More menu"]').click()
    assert wait_on_element(driver, 5, '//div[text()="Delete"]', 'clickable')
    driver.find_element_by_xpath('//div[text()="Delete"]').click()
    assert wait_on_element(driver, 5, '//h2[contains(.,"Delete file?")]')
    assert wait_on_element(driver, 5, '//button[contains(.,"Delete")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Delete")]').click()
    assert wait_on_element(driver, 5, '//span[text()="Explaining_BSD.pdf"]', 'clickable')
    action = ActionChains(driver)
    action.move_to_element(driver.find_element_by_xpath('//tr[contains(.,"music")]')).perform()
    assert wait_on_element(driver, 5, '//button[@aria-label="More menu"]', 'clickable')
    driver.find_element_by_xpath('//button[@aria-label="More menu"]').click()
    assert wait_on_element(driver, 5, '//div[text()="Delete"]', 'clickable')
    driver.find_element_by_xpath('//div[text()="Delete"]').click()
    assert wait_on_element(driver, 5, '//h2[contains(.,"Delete folder?")]')
    assert wait_on_element(driver, 5, '//button[contains(.,"Delete")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Delete")]').click()
    assert wait_on_element_disappear(driver, 10, '//span[text()="music"]')


@then('select PUSH as the Direction then under Transfer Mode, select SYNC')
def select_push_as_the_direction_then_under_transfer_mode_select_sync(driver):
    """select PUSH as the Direction then under Transfer Mode, select SYNC."""
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"PULL")]')
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"SYNC")]')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Direction"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Direction"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Direction_PUSH"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Direction_PUSH"]').click()
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"PUSH")]')
    assert wait_on_element(driver, 5, '//h1[contains(.,"Transfer Mode Reset")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"COPY")]')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Transfer Mode"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Transfer Mode"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Transfer Mode_SYNC"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Transfer Mode_SYNC"]').click()
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"SYNC")]')


@then('verify all files are sync to the Dropbox test folder tab')
def verify_all_files_are_sync_to_the_Dropbox_test_folder_tab(driver):
    """verify all files are sync to the Dropbox test folder tab."""
    driver.switch_to.window(driver.window_handles[1])
    time.sleep(0.5)
    driver.refresh()
    time.sleep(2)
    assert wait_on_element(driver, 5, '//nav[contains(.,"test")]//span[text()="test"]')
    assert wait_on_element(driver, 7, '//span[text()="Explaining_BSD.pdf"]', 'clickable')
    assert wait_on_element(driver, 5, '//span[text()="music"]', 'clickable')
    driver.find_element_by_xpath('//span[text()="music"]').click()
    assert wait_on_element(driver, 5, '//nav[contains(.,"music")]//span[text()="music"]')
    assert wait_on_element(driver, 5, '//span[text()="Mr_Smith_Pequeñas_Guitarras.mp3"]', 'clickable')
    assert wait_on_element(driver, 5, '//nav[contains(.,"test")]//a[contains(.,"test")]', 'clickable')
    driver.find_element_by_xpath('//nav[contains(.,"test")]//a[contains(.,"test")]').click()


@then('on the dataset folder, delete a file')
def on_the_dataset_folder_delete_a_file(driver, nas_ip):
    """on the dataset folder, delete a file."""
    cmd = 'rm -rf /mnt/system/dropbox_cloud/music'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True, results['output']


@then('verify the file is removed from the Dropbox test folder tab')
def verify_the_file_is_removed_from_the_dropbox_test_folder_tab(driver):
    """verify the file is removed from the Dropbox test folder tab."""
    driver.switch_to.window(driver.window_handles[1])
    time.sleep(1)
    driver.refresh()
    time.sleep(2)
    assert wait_on_element(driver, 5, '//nav[contains(.,"test")]//span[text()="test"]')
    assert wait_on_element(driver, 7, '//span[text()="Explaining_BSD.pdf"]')
    assert not is_element_present(driver, '//span[text()="music"]')
    # clean the test folder on box tab before closing the tab.
    assert wait_on_element(driver, 5, '//span[text()="Explaining_BSD.pdf"]', 'clickable')
    action = ActionChains(driver)
    action.move_to_element(driver.find_element_by_xpath('//span[text()="Explaining_BSD.pdf"]')).perform()
    assert wait_on_element(driver, 5, '//button[@aria-label="More menu"]', 'clickable')
    driver.find_element_by_xpath('//button[@aria-label="More menu"]').click()
    assert wait_on_element(driver, 5, '//div[text()="Delete"]', 'clickable')
    driver.find_element_by_xpath('//div[text()="Delete"]').click()
    assert wait_on_element(driver, 5, '//h2[contains(.,"Delete file?")]')
    assert wait_on_element(driver, 5, '//button[contains(.,"Delete")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Delete")]').click()
    assert wait_on_element_disappear(driver, 10, '//span[text()="Explaining_BSD.pdf"]')
    driver.close()
    driver.switch_to.window(driver.window_handles[0])
