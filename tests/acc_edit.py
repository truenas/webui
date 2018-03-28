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

#error handling/screenshotsave
import sys
import traceback
import os
cwd = str(os.getcwd())

import time
import unittest
import xmlrunner
import random
try:
    import unittest2 as unittest
except ImportError:
    import unittest


xpaths = {
        'navAccount' : '//*[@id="nav-1"]/div/a[1]',
        'submenuUser' : '//*[@id="1-1"]',
        'submenuGroup' : '//*[@id="1-0"]',
        }

class edit_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    # Test navigation Account>Users>Hover>New User and enter username,fullname,password,confirmation and wait till user is  visibile in the list
    def test_01_00_nav_acc_user(self):
        try:
            # Click  Account menu
            print (" navigating to the user submenu")
            a = driver.find_element_by_xpath(xpaths['navAccount'])
            a.click()
            # allowing the button to load
            time.sleep(1)
            # Click User submenu
            driver.find_element_by_xpath(xpaths['submenuUser']).click()
            # get the ui element
            ui_element=driver.find_element_by_xpath('//*[@id="breadcrumb-bar"]/ul/li[2]/a')
            # get the weather data
            page_data=ui_element.text
            print ("the Page now is: " + page_data)
            # assert response
            self.assertTrue("User" in page_data)
            # Taking screenshot
            self.screenshot("_")
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            self.screenshot("-e")
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i])
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")



    def test_01_01_edit_userNAS_email(self):
        try:
            print ("Check if the email has been registered ")
            time.sleep(2)
            #call edit funtion on the userNAS
            self.edit("user", newusername)
            # get the ui element
            ui_email=driver.find_element_by_xpath('//*[@id="email"]/mat-input-container/div/div[1]/div/input')
            # get the weather data
            email_data=ui_email.get_attribute('value')
            print ("the email for user " + newusername + " is " + email_data)
            # assert response
            self.assertTrue(newuseremail in email_data)
            # Taking screenshot
            self.screenshot("_")
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            self.screenshot("-e")
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i])
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")



    def test_01_02_edit_userNAS_sudo(self):
        try:
            print ("Changing permission to sudo user ")
            # Changing permission to sudo
            ui_sudo=driver.find_element_by_xpath('//*[@id="sudo"]/mat-checkbox')
            driver.find_element_by_xpath('//*[@id="save_button"]').click()
            time.sleep(15)
            # Taking screenshot
            self.screenshot("_")
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            self.screenshot("-e")
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i])
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")



    def test_02_00_nav_acc_group(self):
        try:
            # Click  Account menu
            print (" navigating to the group submenu")
            # Click User submenu
            driver.find_element_by_xpath(xpaths['submenuGroup']).click()
            # get the ui element
            ui_element=driver.find_element_by_xpath('//*[@id="breadcrumb-bar"]/ul/li[2]/a')
            # get the weather data
            page_data=ui_element.text
            print ("the Page now is: " + page_data)
            # assert response
            self.assertTrue("Group" in page_data)
            # Taking screenshot
            self.screenshot("_")
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            self.screenshot("-e")
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i])
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")



    def test_02_01_edit_groupNAS_sudo(self):
        try:
            print ("change permission of groupNAS to sudo")
            time.sleep(2)
            self.edit("group", newgroupname)
            driver.find_element_by_xpath('//*[@id="bsdgrp_sudo"]/mat-checkbox/label/div').click()
            driver.find_element_by_xpath('//*[@id="save_button"]').click()
            time.sleep(20)
            # Taking screenshot
            self.screenshot("_")
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            self.screenshot("-e")
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i])
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")



    # Next step-- To check if the new user is present in the list via automation


    # method to test if an element is present
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
        if self.is_element_present(By.XPATH,'/html/body/div[3]/div/div[2]/md-dialog-container/error-dialog/div[1]/p'):
            ui_element=driver.find_element_by_xpath('/html/body/div[3]/div/div[2]/md-dialog-container/error-dialog/div[1]/p')
            error_element=ui_element.text
            print (error_element)
            driver.find_element_by_xpath('/html/body/div[3]/div/div[2]/md-dialog-container/error-dialog/div[2]/button').click()

    def edit(self, type, name):
        # the convention is set in such a way tha a single funtion can cleanup both type:user/group, name:name of the group or user
        # path plugs in the xpath of user or group , submenu{User/Group}
        # num specifies the column of the 3 dots which is different in user/group
        # delNum speifies the option number where edit is after clicking on the 3 dots
        if (type == "user"):
            num = 7
            delNum = 1
            path = "User"
           # ED = "EDIT"
        elif (type == "group"):
            num = 4
            delNum = 2
            path = "Group"
           # ED = "Edit"

        # Click User submenu
        driver.find_element_by_xpath(xpaths['submenu' + path]).click()
        # wait till the list is loaded
        time.sleep(2)
        index = 1
        ui_text = "null"
        for x in range(1, 10):
            if self.is_element_present(By.XPATH, '//*[@id="entity-table-component"]/div[4]/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[' + str(x) + ']/datatable-body-row/div[2]/datatable-body-cell[1]/div/div'):
                ui_element=driver.find_element_by_xpath('//*[@id="entity-table-component"]/div[4]/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[' + str(x) + ']/datatable-body-row/div[2]/datatable-body-cell[1]/div/div')
                ui_text = ui_element.text
            if (ui_text == name):
                index = x
                break
            ui_element = " "
        print ("index, delNum, num: " + str(x) + ", " + str(delNum) + "," + str(num))
        time.sleep(1)
        # click on the 3 dots
        driver.find_element_by_xpath('//*[@id="entity-table-component"]/div[4]/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[' + str(x) + ']/datatable-body-row/div[2]/datatable-body-cell[' + str(num) + ']/div/app-entity-table-actions/div/mat-icon').click()
        time.sleep(1)
        # click on edit option
        driver.find_element_by_xpath('//*[@id="action_button_Edit"]').click()

    def screenshot(self, count):
        test_method_name = self._testMethodName
        time.sleep(1)
        text_path = os.path.dirname(os.path.realpath(__file__))
        filename = str(__file__)
        filename = filename[:-4]
        final_file = filename.replace(text_path + "/", '')
        print ("Taking screenshot for " + final_file + "-" + test_method_name)
        driver.save_screenshot(cwd + "/screenshot/"  + "screenshot-" + final_file + "-" + test_method_name + ".png")

    @classmethod
    def tearDownClass(inst):
        pass

def run_edit_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(edit_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
