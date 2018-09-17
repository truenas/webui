# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 5

import function
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

xpaths = { 'navService': '//*[@id="nav-8"]/div/a[1]',
           'turnoffConfirm': '//*[contains(text(), "OK")]',
           'configButton' : '/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/services/div/div[17]/entity-card/div[1]/div/mat-card[1]/div/div[2]/div[3]/button',
           'webdavPassword' : '//*[@id="webdav_password"]/mat-input-container/div/div[1]/div/input',
           'webdavPassword2' : '//*[@id="webdav_password2"]/mat-input-container/div/div[1]/div/input'
         }


class conf_webdav_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    def test_01_turnon_webdav (self):
        try:
            print (" turning on the webdav service")
            # Click Service Menu
            driver.find_element_by_xpath(xpaths['navService']).click()
            # check if the Services page is open
            time.sleep(1)
            # get the ui element
            ui_element_page=driver.find_element_by_xpath('//*[@id="breadcrumb-bar"]/ul/li/a')
            # get the weather data
            page_data=ui_element_page.text
            print ("the Page now is: " + page_data)
            # assert response
            self.assertTrue("Services" in page_data)
            # scroll down
            driver.find_element_by_tag_name('body').send_keys(Keys.END)
            time.sleep(2)
            function.status_change(driver, self, "17", "start")
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

    def test_02_checkif_webdav_on (self):
        try:
            print (" check if webdav turned on")
            time.sleep(2)
            #status check
            function.status_check(driver, "17")
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

    def test_03_configure_webdav(self):
        try:
            print (" configuring webdav service")
            time.sleep(1)
            # click on configure button
            driver.find_element_by_xpath(xpaths['configButton']).click()
            time.sleep(1)
            # Enter password newuserpassword
            driver.find_element_by_xpath(xpaths['webdavPassword']).clear()
            print ("clear the webdav password field")
            driver.find_element_by_xpath(xpaths['webdavPassword']).send_keys(newuserpassword)
            # Enter password confirmation newuserpassword
            driver.find_element_by_xpath(xpaths['webdavPassword2']).clear()
            print ("clear the webdav password2 field")
            driver.find_element_by_xpath(xpaths['webdavPassword2']).send_keys(newuserpassword)
            # Click on save button
            driver.find_element_by_xpath('//*[@id="save_button"]').click()
            #wait till saving is finished
            time.sleep(5)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

    def test_04_turnoff_webdav (self):
        try:
            print (" turning off the webdav service")
            # Click Service Menu
            driver.find_element_by_xpath(xpaths['navService']).click()
            # scroll down
            driver.find_element_by_tag_name('html').send_keys(Keys.END)
            time.sleep(2)
            function.status_change(driver, self, "17", "stop")
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

    def test_05_checkif_wedbdav_off (self):
        try:
            print (" check if webdave turned off")
            time.sleep(2)
            #status check
            function.status_check(driver, "17")
            time.sleep(10)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

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


    @classmethod
    def tearDownClass(inst):
        pass

def run_conf_webdav_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(conf_webdav_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
