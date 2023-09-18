
import time
import xpaths
from function import (
    is_element_present,
    wait_on_element,
    wait_on_element_disappear
)


def Click_Clear_Input(driver, xpath, value):
    driver.find_element_by_xpath(xpath).click()
    driver.find_element_by_xpath(xpath).clear()
    driver.find_element_by_xpath(xpath).send_keys(value)


def Close_Common_Warning(driver):
    assert wait_on_element(driver, 5, xpaths.popup.warning)
    assert wait_on_element(driver, 5, xpaths.button.close, 'clickable')
    driver.find_element_by_xpath(xpaths.button.close).click()


def Combobox_Input_And_Select(driver, xpath, value):
    assert wait_on_element(driver, 5, xpath, 'inputable')
    driver.find_element_by_xpath(xpath).clear()
    driver.find_element_by_xpath(xpath).send_keys(value)
    assert wait_on_element(driver, 5, xpaths.edit_Acl.combobox_Option(value), 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.combobox_Option(value)).click()


def Confirm_Creating_Pool(driver):
    assert wait_on_element(driver, 10, xpaths.popup.warning)
    assert wait_on_element(driver, 7, xpaths.checkbox.old_Confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.old_Confirm).click()
    assert wait_on_element(driver, 7, xpaths.pool_manager.create_Pool_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.pool_manager.create_Pool_Button).click()


def Confirm_Failover(driver):
    assert wait_on_element(driver, 5, '//h1[text()="Initiate Failover"]')
    assert wait_on_element(driver, 5, '//mat-checkbox[contains(@class,"confirm-checkbox")]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[contains(@class,"confirm-checkbox")]').click()
    assert wait_on_element(driver, 5, '//button[span/text()=" Failover "]', 'clickable')
    driver.find_element_by_xpath('//button[span/text()=" Failover "]').click()
    time.sleep(10)


def Confirm_Single_Disk(driver):
    assert wait_on_element(driver, 10, xpaths.popup.warning)
    assert wait_on_element(driver, 7, xpaths.checkbox.old_Confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.old_Confirm).click()
    assert wait_on_element(driver, 7, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()


def Confirm_Warning(driver):
    assert wait_on_element(driver, 5, xpaths.popup.warning)
    assert wait_on_element(driver, 5, xpaths.checkbox.old_Confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.old_Confirm).click()
    assert wait_on_element(driver, 5, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()
    time.sleep(1)


def Dismiss_All_Alerts(driver):
    if wait_on_element(driver, 5, '//span[contains(.,"notifications")]//span[not(contains(text(),"0"))]'):
        assert wait_on_element(driver, 7, xpaths.toolbar.notification_Button, 'clickable')
        driver.find_element_by_xpath(xpaths.toolbar.notification_Button).click()
        assert wait_on_element(driver, 7, xpaths.alert.title)
        assert wait_on_element(driver, 7, '//button[contains(text(),"Dismiss All Alerts")]', 'clickable')
        driver.find_element_by_xpath('//button[contains(text(),"Dismiss All Alerts")]').click()
        assert wait_on_element(driver, 7, '//mat-icon[contains(.,"clear")]', 'clickable')
        driver.find_element_by_xpath('//mat-icon[contains(.,"clear")]').click()


def Go_To_Service(driver):
    driver.find_element_by_xpath(xpaths.side_Menu.system_Setting).click()
    assert wait_on_element(driver, 5, xpaths.side_Menu.services, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.services).click()


def HA_Login_Status_Enable(driver):
    assert wait_on_element(driver, 180, xpaths.login.user_Input)
    assert wait_on_element(driver, 240, xpaths.login.ha_Status_Enable)


def Input_Value(driver, xpath, value):
    driver.find_element_by_xpath(xpath).clear()
    driver.find_element_by_xpath(xpath).send_keys(value)


def Login(driver, user, password):
    driver.find_element_by_xpath(xpaths.login.user_Input).clear()
    driver.find_element_by_xpath(xpaths.login.user_Input).send_keys(user)
    driver.find_element_by_xpath(xpaths.login.password_Input).clear()
    driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(password)
    assert wait_on_element(driver, 5, xpaths.login.signin_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.login.signin_Button).click()


def Login_If_Not_On_Dashboard(driver, user, password):
    if not is_element_present(driver, xpaths.side_Menu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
        driver.find_element_by_xpath(xpaths.login.user_Input).clear()
        driver.find_element_by_xpath(xpaths.login.user_Input).send_keys(user)
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(password)
        assert wait_on_element(driver, 5, xpaths.login.signin_Button, 'clickable')
        driver.find_element_by_xpath(xpaths.login.signin_Button).click()
    else:
        assert wait_on_element(driver, 5, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()


def Leave_Domain(driver, user, password):
    assert wait_on_element(driver, 5, '//h1[text()="Leave Domain"]')
    assert wait_on_element(driver, 5, '//ix-input[@formcontrolname="username"]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="username"]//input').send_keys(user)
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password"]//input').send_keys(password)

    driver.find_element_by_xpath('//mat-dialog-container//button[contains(.,"Leave Domain")]').click()
    assert wait_on_element_disappear(driver, 120, xpaths.popup.please_Wait)


def Restart_SMB_Service(driver):
    assert wait_on_element(driver, 7, xpaths.popup.smb_Restart_Title)
    assert wait_on_element(driver, 5, xpaths.popup.smb_Restart_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.popup.smb_Restart_Button).click()


def Select_Option(driver, xpath):
    assert wait_on_element(driver, 5, xpath, 'clickable')
    driver.find_element_by_xpath(xpath).click()


def Trigger_Failover(driver):
    assert wait_on_element(driver, 60, xpaths.toolbar.ha_Enabled)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Information_Standby_Title)
    assert wait_on_element(driver, 10, xpaths.button.initiate_Failover, 'clickable')
    driver.find_element_by_xpath(xpaths.button.initiate_Failover).click()


def Verify_Degraded_Alert(driver):
    for _ in range(180):
        assert wait_on_element(driver, 5, xpaths.toolbar.notification_Button, 'clickable')
        driver.find_element_by_xpath(xpaths.toolbar.notification_Button).click()
        assert wait_on_element(driver, 5, xpaths.alert.panel_Open)
        if wait_on_element(driver, 3, xpaths.alert.degraded_Critical_Level):
            break
        assert wait_on_element(driver, 5, xpaths.alert.close_Button, 'clickable')
        driver.find_element_by_xpath(xpaths.alert.close_Button).click()
        assert wait_on_element_disappear(driver, 5, xpaths.alert.panel_Open)

    assert is_element_present(driver, xpaths.alert.degraded_Pool_Text)
    assert wait_on_element(driver, 5, xpaths.alert.close_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.alert.close_Button).click()
    time.sleep(0.5)


def Verify_Degraded_Alert_Is_Gone(driver):
    for _ in range(180):
        assert wait_on_element(driver, 5, xpaths.toolbar.notification_Button, 'clickable')
        driver.find_element_by_xpath(xpaths.toolbar.notification_Button).click()
        assert wait_on_element(driver, 5, xpaths.alert.panel_Open)
        if is_element_present(driver, xpaths.alert.degraded_Critical_Level) is False:
            break
        assert wait_on_element(driver, 5, xpaths.alert.close_Button, 'clickable')
        driver.find_element_by_xpath(xpaths.alert.close_Button).click()
        assert wait_on_element_disappear(driver, 5, xpaths.alert.panel_Open)

    assert is_element_present(driver, xpaths.alert.degraded_Pool_Text) is False
    assert wait_on_element(driver, 5, xpaths.alert.close_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.alert.close_Button).click()
    time.sleep(0.5)


def Verify_Element_Text(driver, xpath, value):
    element_text = driver.find_element_by_xpath(xpath).text
    assert element_text == value


def Verify_The_Dashboard(driver):
    assert wait_on_element(driver, 5, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)


def Verify_App_Status(driver, app_Name, app):
    if is_element_present(driver, f'//mat-card[contains(.,"{app_Name}")]//span[@class="status active"]') is False:
        assert wait_on_element(driver, 20, f'//strong[contains(.,"{app_Name}")]', 'clickable')
        driver.find_element_by_xpath(f'//strong[contains(.,"{app_Name}")]').click()
        if wait_on_element(driver, 3, xpaths.popup.please_Wait):
            assert wait_on_element_disappear(driver, 60, xpaths.popup.please_Wait)
        # refresh loop
        assert wait_on_element(driver, 10, '//mat-panel-title[contains(.,"Application Events")]', 'clickable')
        driver.find_element_by_xpath('//mat-panel-title[contains(.,"Application Events")]').click()

        timeout = time.time() + 30
        while time.time() < timeout:
            assert wait_on_element(driver, 10, '//span[contains(.,"Refresh Events")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Refresh Events")]').click()
            # make sure Please wait pop up is gone before continuing.
            if wait_on_element(driver, 3, xpaths.popup.please_Wait):
                assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)

            # to make sure the loop does not run to fast.
            time.sleep(1)

            if is_element_present(driver, f'//div[contains(text(),"Started container {app}")]'):
                break

        assert wait_on_element(driver, 10, xpaths.button.close, 'clickable')
        driver.find_element_by_xpath(xpaths.button.close).click()
        assert wait_on_element_disappear(driver, 40, xpaths.progress.spinner)
        assert wait_on_element(driver, 720, f'//mat-card[contains(.,"{app_Name}")]//span[@class="status active"]')
    else:
        assert wait_on_element(driver, 720, f'//mat-card[contains(.,"{app_Name}")]//span[@class="status active"]')


def Wait_For_Inputable_And_Input_Value(driver, xpath, value):
    assert wait_on_element(driver, 5, xpath, 'inputable')
    driver.find_element_by_xpath(xpath).clear()
    driver.find_element_by_xpath(xpath).send_keys(value)
