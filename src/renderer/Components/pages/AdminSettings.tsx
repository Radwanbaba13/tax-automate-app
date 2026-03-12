import React, { useState } from 'react';
import {
  Box,
  Button,
  Text,
  Input,
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
  Flex,
  Icon,
} from '@chakra-ui/react';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { FiLock, FiShield } from 'react-icons/fi';
import { showToast } from '../../Utils/toast';
import { api } from '../../Utils/apiClient';
import SummaryConfig from '../config/SummaryConfig';
import PriceListConfig from '../config/PriceListConfig';
import DocTextConfig from '../config/DocTextConfig';

function AdminSettingsComponent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [wrongPassword, setWrongPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const handleAuth = async () => {
    const { data, error } = await api.users.verifyPassword(password);

    if (error || !data.verified) {
      setWrongPassword(true);
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
      setPassword('');
      setWrongPassword(false);
    }
  };

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

  if (!isAuthenticated) {
    return (
      <Flex
        w="100%"
        h="100%"
        align="center"
        justify="center"
        py={16}
      >
        <Box
          bg="white"
          _dark={{ bg: '#242424', borderColor: '#363636' }}
          borderRadius="16px"
          border="1px solid"
          borderColor="gray.200"
          boxShadow="0 4px 24px rgba(0,0,0,0.06)"
          p={10}
          w="100%"
          maxW="420px"
          textAlign="center"
        >
          <Flex
            w="56px"
            h="56px"
            borderRadius="14px"
            bg="#cf33501a"
            align="center"
            justify="center"
            mx="auto"
            mb={5}
          >
            <Icon as={FiShield} boxSize={6} color="#cf3350" />
          </Flex>

          <Heading size="md" mb={1} fontWeight="700">
            Admin Settings
          </Heading>
          <Text fontSize="sm" color="gray.500" mb={6}>
            Enter your password to access admin settings
          </Text>

          {wrongPassword && (
            <Box mb={4} p={3} borderRadius="10px" bg="red.50" _dark={{ bg: 'rgba(207,51,80,0.1)' }}>
              <Text color="#cf3350" fontWeight="600" fontSize="sm">
                Incorrect password. Please try again.
              </Text>
            </Box>
          )}

          <InputGroup size="lg" mb={4}>
            <Input
              type={showLoginPassword ? 'text' : 'password'}
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (wrongPassword) setWrongPassword(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAuth();
              }}
              borderRadius="10px"
              borderColor={wrongPassword ? '#cf3350' : 'gray.200'}
              _focus={{
                borderColor: '#cf3350',
                boxShadow: '0 0 0 1px #cf3350',
              }}
              pl={4}
            />
            <InputRightElement>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                _hover={{ bg: 'transparent' }}
              >
                {showLoginPassword ? (
                  <HiEyeOff color="#757575" />
                ) : (
                  <HiEye color="#757575" />
                )}
              </Button>
            </InputRightElement>
          </InputGroup>

          <Button
            colorScheme="brand"
            w="100%"
            size="lg"
            borderRadius="10px"
            onClick={handleAuth}
            leftIcon={<FiLock />}
          >
            Unlock
          </Button>
        </Box>
      </Flex>
    );
  }

  return (
        <VStack spacing={6} align="stretch" w="100%">
          <Tabs colorScheme="brand">
            <TabList>
              <Tab>Summary Configuration</Tab>
              <Tab>Price List Configuration</Tab>
              <Tab>Document Text</Tab>
              <Tab>Account Settings</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <Box
                  bg="white"
                  _dark={{ bg: '#242424', borderColor: '#363636' }}
                  borderRadius="lg"
                  boxShadow="sm"
                  border="1px solid"
                  borderColor="gray.200"
                  p={6}
                >
                  <SummaryConfig setIsSidebarOpen={() => {}} />
                </Box>
              </TabPanel>

              <TabPanel>
                <Box
                  bg="white"
                  _dark={{ bg: '#242424', borderColor: '#363636' }}
                  borderRadius="lg"
                  boxShadow="sm"
                  border="1px solid"
                  borderColor="gray.200"
                  p={6}
                >
                  <PriceListConfig setIsSidebarOpen={() => {}} />
                </Box>
              </TabPanel>

              <TabPanel>
                <Box
                  bg="white"
                  _dark={{ bg: '#242424', borderColor: '#363636' }}
                  borderRadius="lg"
                  boxShadow="sm"
                  border="1px solid"
                  borderColor="gray.200"
                  p={6}
                >
                  <DocTextConfig />
                </Box>
              </TabPanel>

              <TabPanel>
                <Box
                  bg="white"
                  _dark={{ bg: '#242424', borderColor: '#363636' }}
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
  );
}

export default AdminSettingsComponent;
