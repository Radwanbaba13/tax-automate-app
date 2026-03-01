import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Text,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  InputGroup,
  InputRightElement,
  Heading,
  VStack,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { showToast } from '../../Utils/toast';
import { api } from '../../Utils/apiClient';
import SummaryConfig from '../config/SummaryConfig';
import PriceListConfig from '../config/PriceListConfig';

function AdminSettingsComponent() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [wrongPassword, setWrongPassword] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  // Open authentication modal on mount
  useEffect(() => {
    if (!isAuthenticated) {
      onOpen();
    }
  }, [isAuthenticated, onOpen]);

  // Function to handle password submission for authentication
  const handleAuth = async () => {
    const { data, error } = await api.users.verifyPassword(password);

    if (error || !data.verified) {
      setWrongPassword(true);
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
      setPassword('');
      setWrongPassword(false);
      onClose();
    }
  };

  // Function to handle password change
  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setPasswordChangeError('All fields are required.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('New passwords do not match.');
      return;
    }

    if (newPassword === oldPassword) {
      setPasswordChangeError(
        'New password cannot be the same as the old password.',
      );
      return;
    }

    const { error } = await api.users.updatePassword(oldPassword, newPassword);

    if (error) {
      setPasswordChangeError(error.message || 'Error updating password.');
    } else {
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordChangeError('');
      showToast({
        title: 'Password changed',
        description: 'Your password has been updated successfully.',
        status: 'success',
      });
    }
  };

  return (
    <>
      {/* Authentication Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        closeOnOverlayClick={false}
        closeOnEsc={false}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Admin Authentication Required</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {wrongPassword && (
              <Box mb={4} p={3} borderRadius="md" bg="red.50">
                <Text color="brand.500" fontWeight="600" fontSize="sm">
                  Incorrect password. Please try again.
                </Text>
              </Box>
            )}
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAuth();
                }
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="brand" onClick={handleAuth}>
              Authenticate
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Main Content - Only show if authenticated */}
      {isAuthenticated && (
        <VStack spacing={6} align="stretch" w="100%">
          <Tabs colorScheme="brand">
            <TabList>
              <Tab>Summary Configuration</Tab>
              <Tab>Price List Configuration</Tab>
              <Tab>Account Settings</Tab>
            </TabList>

            <TabPanels>
              {/* Summary Configuration Tab */}
              <TabPanel>
                <Box
                  bg="white"
                  borderRadius="lg"
                  boxShadow="sm"
                  border="1px solid"
                  borderColor="gray.200"
                  p={6}
                >
                  <SummaryConfig setIsSidebarOpen={() => {}} />
                </Box>
              </TabPanel>

              {/* Price List Configuration Tab */}
              <TabPanel>
                <Box
                  bg="white"
                  borderRadius="lg"
                  boxShadow="sm"
                  border="1px solid"
                  borderColor="gray.200"
                  p={6}
                >
                  <PriceListConfig setIsSidebarOpen={() => {}} />
                </Box>
              </TabPanel>

              {/* Account Settings Tab */}
              <TabPanel>
                <Box
                  bg="white"
                  borderRadius="lg"
                  boxShadow="sm"
                  border="1px solid"
                  borderColor="gray.200"
                  p={6}
                >
                  <VStack spacing={6} align="stretch">
                    <Heading size="md">Change Admin Password</Heading>

                    {passwordChangeError && (
                      <Box p={3} borderRadius="md" bg="red.50">
                        <Text color="brand.500" fontSize="sm">
                          {passwordChangeError}
                        </Text>
                      </Box>
                    )}

                    {/* Old Password Input */}
                    <Box>
                      <Text
                        mb={2}
                        fontWeight="600"
                        fontSize="sm"
                        color="gray.600"
                      >
                        Old Password
                      </Text>
                      <InputGroup>
                        <Input
                          type={showOldPassword ? 'text' : 'password'}
                          placeholder="Enter old password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                        />
                        <InputRightElement>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                          >
                            {showOldPassword ? (
                              <HiEyeOff color="#cf3350" />
                            ) : (
                              <HiEye color="#cf3350" />
                            )}
                          </Button>
                        </InputRightElement>
                      </InputGroup>
                    </Box>

                    {/* New Password Input */}
                    <Box>
                      <Text
                        mb={2}
                        fontWeight="600"
                        fontSize="sm"
                        color="gray.600"
                      >
                        New Password
                      </Text>
                      <InputGroup>
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <InputRightElement>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <HiEyeOff color="#cf3350" />
                            ) : (
                              <HiEye color="#cf3350" />
                            )}
                          </Button>
                        </InputRightElement>
                      </InputGroup>
                    </Box>

                    {/* Confirm New Password Input */}
                    <Box>
                      <Text
                        mb={2}
                        fontWeight="600"
                        fontSize="sm"
                        color="gray.600"
                      >
                        Confirm New Password
                      </Text>
                      <InputGroup>
                        <Input
                          type={showConfirmNewPassword ? 'text' : 'password'}
                          placeholder="Confirm new password"
                          value={confirmNewPassword}
                          onChange={(e) =>
                            setConfirmNewPassword(e.target.value)
                          }
                        />
                        <InputRightElement>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setShowConfirmNewPassword(!showConfirmNewPassword)
                            }
                          >
                            {showConfirmNewPassword ? (
                              <HiEyeOff color="#cf3350" />
                            ) : (
                              <HiEye color="#cf3350" />
                            )}
                          </Button>
                        </InputRightElement>
                      </InputGroup>
                    </Box>

                    <HStack justify="flex-start">
                      <Button
                        colorScheme="brand"
                        onClick={handlePasswordChange}
                      >
                        Change Password
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      )}
    </>
  );
}

export default AdminSettingsComponent;
