# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 5

from source import *
from selenium.webdriver.common.keys import Keys
from selenium import webdriver
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
from selenium.common.exceptions import ElementNotVisibleException
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

import time
import unittest
import xmlrunner
import random
try:
    import unittest2 as unittest
except ImportError:
    import unittest


xpaths = {
        'navAccount': "//*[@id='nav-1']/div/a[1]",
        'submenuUser': "//*[@id='1-1']",
        'submenuGroup': "//*[@id='1-0']",
        'newUser': "//*[@id='username']/mat-input-container/div/div[1]/div/input",
        'primaryGroupcheckbox': "//*[@id='group_create']/mat-checkbox/label/div",
        'primaryGroupdropdown': '//*[@id="group"]/mat-form-field/div/div[1]/div',
        'newUserName': "//*[@id='full_name']/mat-input-container/div/div[1]/div/input",
        'newUserEmail': "//*[@id='email']/mat-input-container/div/div[1]/div/input",
        'newUserPass': "//*[@id='password']/mat-input-container/div/div[1]/div/input",
        'newUserPassConf': "//*[@id='password_conf']/mat-input-container/div/div[1]/div/input",
        'permitSudocheckbox': "//*[@id='sudo']/mat-checkbox/label/div",
        'fabTrigger': "//*[@id='myFab']/div/smd-fab-trigger/button",
        'fabAction': "//*[@id='add_action_button']",
        'saveButton': "//*[@id='save_button']"
        }


class create_user_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    # Test navigation Account>Users>Hover>New User and enter username,fullname,password,confirmation and wait till user is  visibile in the list
    def test_01_nav_acc_user(self):
        # Click  Account menu
        print (" navigating to the user submenu")
        a = driver.find_element_by_xpath(xpaths['navAccount'])
        a.click()
        # allowing the button to load
        time.sleep(1)
        # Click User submenu
        driver.find_element_by_xpath(xpaths['submenuUser']).click()
        # get the ui element
        ui_element=driver.find_element_by_xpath("//*[@id='breadcrumb-bar']/ul/li[2]/a")
        # get the weather data
        page_data=ui_element.text
        print ("the Page now is: " + page_data)
        # assert response
        self.assertTrue("User" in page_data)

    def test_02_create_newuser(self):
        print (" creating a new user with create new primary group")
        # cancelling the tour
        if self.is_element_present(By.XPATH, "/html/body/div[6]/div[1]/button"):
            driver.find_element_by_xpath("/html/body/div[6]/div[1]/button").click()
        # scroll down to find hover tab
        driver.find_element_by_tag_name('html').send_keys(Keys.END)
        time.sleep(2)
        # Perform hover to show menu
        hover_element = driver.find_element_by_xpath(xpaths['fabTrigger'])
        hover = ActionChains(driver).move_to_element(hover_element)
        hover.perform()
        time.sleep(1)
        # Click create new user option
        driver.find_element_by_xpath(xpaths['fabAction']).click()
        # Enter New Username
        driver.find_element_by_xpath(xpaths['newUser']).send_keys(newusername)
        # Enter User Full name
        driver.find_element_by_xpath(xpaths['newUserName']).send_keys(newuserfname)
        # Enter User email id
        driver.find_element_by_xpath(xpaths['newUserEmail']).send_keys(newuseremail)
        # Enter Password
        driver.find_element_by_xpath(xpaths['newUserPass']).send_keys(newuserpassword)
        # Enter Password Conf
        driver.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(newuserpassword)
        # Click on create new User button
        driver.find_element_by_xpath(xpaths['saveButton']).click()
        # check if there is a generic error when making a duplicate user, and print the error
        time.sleep(1)
        self.error_check()

    def test_03_create_newuser_primarygroup_uncheck(self):
        time.sleep(2)
        print (" creating a new user without creating a primary group")
        # Click User submenu
        driver.find_element_by_xpath(xpaths['submenuUser']).click()
        # scroll down to find hover tab
        driver.find_element_by_tag_name('html').send_keys(Keys.END)
        time.sleep(2)
        # Perform hover to show menu
        hover_element = driver.find_element_by_xpath(xpaths['fabTrigger'])
        hover = ActionChains(driver).move_to_element(hover_element)
        hover.perform()
        time.sleep(1)
        # Click create new user option
        driver.find_element_by_xpath(xpaths['fabAction']).click()
        # Enter New Username
        driver.find_element_by_xpath(xpaths['newUser']).send_keys(newusernameuncheck)
        # uncheck create primary group  Checkbox
        driver.find_element_by_xpath(xpaths['primaryGroupcheckbox']).click()
        # click on primary group dropdownlist
        driver.find_element_by_xpath(xpaths['primaryGroupdropdown']).click()
#        Select(d).select_by_visible_text("userNAS")
        # select the element from the dropdown list by using selectlist function
        time.sleep(2)
        driver.find_element_by_xpath("//*[contains(text(), 'userNAS')]").click()
#        driver.find_element_by_xpath("//*[text()='userNAS']").click()
#        self.selectlist(newusername)
        # driver.find_element_by_xpath("/html/body/div[3]/div[2]/div/div/md-option[3]").click()
        # Enter User Full name
        driver.find_element_by_xpath(xpaths['newUserName']).send_keys(newuserfnameuncheck)
        # Enter Password
        driver.find_element_by_xpath(xpaths['newUserPass']).send_keys(newuserpassword)
        # Enter Password Conf
        driver.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(newuserpassword)
        # Click on create new User button
        driver.find_element_by_xpath(xpaths['saveButton']).click()
        # check if there is a generic error when making a duplicate user, and print the error
        self.error_check()

    def test_04_create_superuser(self):
        print (" creating a super user with root access")
        time.sleep(2)
        # Click User submenu
        driver.find_element_by_xpath(xpaths['submenuUser']).click()
        # scroll down to find hover tab
        driver.find_element_by_tag_name('html').send_keys(Keys.END)
        time.sleep(2)
        # Perform hover to show menu
        hover_element = driver.find_element_by_xpath(xpaths['fabTrigger'])
        hover = ActionChains(driver).move_to_element(hover_element)
        hover.perform()
        time.sleep(1)
        # Click create new user option
        driver.find_element_by_xpath(xpaths['fabAction']).click()
        # Enter New Username
        driver.find_element_by_xpath(xpaths['newUser']).send_keys(superusername)
        # Enter User Full name
        driver.find_element_by_xpath(xpaths['newUserName']).send_keys(superuserfname)
        # Enter Password
        driver.find_element_by_xpath(xpaths['newUserPass']).send_keys(superuserpassword)
        # Enter Password Conf
        driver.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(superuserpassword)
        # check Permit Sudo Checkbox
        driver.find_element_by_xpath(xpaths['permitSudocheckbox']).click()
        # Click on create new User button
        driver.find_element_by_xpath(xpaths['saveButton']).click()
        # check if there is a generic error when making a duplicate user, and print the error
        self.error_check()
        # check if the the user list is loaded after addding a new user

    def test_05_create_duplicateuser(self):
        print (" creating a duplicate user")
        # Click User submenu
        driver.find_element_by_xpath(xpaths['submenuUser']).click()
        # cancelling the tour
        if self.is_element_present(By.XPATH,"/html/body/div[6]/div[1]/button"):
            driver.find_element_by_xpath("/html/body/div[6]/div[1]/button").click()

        # scroll down to find hover tab
        driver.find_element_by_tag_name('html').send_keys(Keys.END)
        time.sleep(2)
        # Perform hover to show menu
        hover_element = driver.find_element_by_xpath(xpaths['fabTrigger'])
        hover = ActionChains(driver).move_to_element(hover_element)
        hover.perform()
        time.sleep(1)
        # Click create new user option
        driver.find_element_by_xpath(xpaths['fabAction']).click()
        # Enter New Username
        driver.find_element_by_xpath(xpaths['newUser']).send_keys(newusername)
        # Enter User Full name
        driver.find_element_by_xpath(xpaths['newUserName']).send_keys(newuserfname)
        # Enter Password
        driver.find_element_by_xpath(xpaths['newUserPass']).send_keys(newuserpassword)
        # Enter Password Conf
        driver.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(newuserpassword)
        # Click on create new User button
        driver.find_element_by_xpath(xpaths['saveButton']).click()
        # check if there is a generic error when making a duplicate user, and print the error
        self.error_check()
        time.sleep(20)


    # Next step-- To check if the new user is present in the list via automation


    #method to test if an element is present
    def is_element_present(self, how, what):
        """
        Helper method to confirm the presence of an element on page
        :params how: By locator type
        :params what: locator value
        """
        try: driver.find_element(by=how, value=what)
        except NoSuchElementException: return False
        return True

    def error_check(self):
        if self.is_element_present(By.XPATH, "//*[contains(text(), 'Close')]"):
            if self.is_element_present(By.XPATH,"/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1"):
                ui_element=driver.find_element_by_xpath("/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1")
                error_element=ui_element.text
                print (error_element)
            driver.find_element_by_xpath("//*[contains(text(), 'Close')]").click()
            print ("Duplicate user cannot be created")

    def selectlist(self, element):
        for i in range(0,10):
            if self.is_element_present(By.XPATH, "/html/body/div[4]/div[2]/div/div/md-option[" + str(i) + "]"):
                dropdown_el = driver.find_element_by_xpath("/html/body/div[4]/div[2]/div/div/md-option[" + str(i) + "]")
                dropdown_text = dropdown_el.text
                if dropdown_text == element:
                    dropdown_el.click()
                    break



    @classmethod
    def tearDownClass(inst):
        pass

def run_create_user_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(create_user_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
