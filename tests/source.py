# Author: Rishabh Chauhan
# License: BSD
# Location for tests of FreeNAS new GUI

from os import getcwd

#username for the machine
username = "root"
#password for the machine
password = "testing"
#new user with create primary group check
newusername = "userNAS"
#new user full name
newuserfname = "user NAS"
#userpassword
newuserpassword = "abcd1234"
#usergroupname
newgroupname = "groupNAS"

#new user with create primary group UNcheck
newusernameuncheck = "userNASuncheck"
#new user full name
newuserfnameuncheck = "user NASuncheck"


#new user with sudo permit
superusername = "superNAS"

superuserfname = "super NAS"

superuserpassword = "abcd1234"

supergroupname = "supergroupNAS"

results_xml = getcwd() + '/results/'

#method to test if an element is present-not used in the current script
def is_element_present_source(self, how, what):
  """
  Helper method to confirm the presence of an element on page
  :params how: By locator type
  :params what: locator value
  """
  try: self.driver.find_element(by=how, value=what)
  except NoSuchElementException: return False
  return True

