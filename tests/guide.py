
# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 2

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

xpaths = { 'navGuide' : "//*[@id='nav-15']/div/a[1]",
          'version' : "/html/body/div/nav/div[1]/a",
          }


class view_guide_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    # Test navigation Account>Users>Hover>New User and enter username,fullname,password,confirmation and wait till user is  visibile in the list
    def test_01_nav_guide(self):
        # Click an element indirectly
        driver.find_element_by_xpath(xpaths['navGuide']).click()
        # allowing page to load by giving explicit time(in seconds)
        time.sleep(1)
        # get the ui element
        ui_element=driver.find_element_by_xpath("//*[@id='breadcrumb-bar']/ul/li/a")
        # get the weather data
        page_data=ui_element.text
        print ("the Page now is: " + page_data)
        # assert response
        self.assertTrue("Guide" in page_data)

    def test_02_check_version(self):
        # cancelling the tour
        if self.is_element_present(By.XPATH,"/html/body/div[6]/div[1]/button"):
            driver.find_element_by_xpath("/html/body/div[6]/div[1]/button").click()

#        driver.find_element_by_xpath("/html/body/div/nav/div[2]/ul/li[1]/a").click()
#        ui_element=driver.find_element_by_xpath("/html/body/div/section/div/div/div[2]/div/p[5]")
        # get the weather data
#        page_data=ui_element.text
#        print ("The version of FreeNAS guide is:  " + page_data)
        # assert response to check version of freenas guide
#        self.assertTrue("FreeNAS" in page_data)
#        time.sleep(10)


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

def run_view_guide_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(view_guide_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
