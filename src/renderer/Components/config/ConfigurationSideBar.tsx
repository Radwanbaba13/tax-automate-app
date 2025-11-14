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
  Select,
  InputGroup,
  InputRightElement,
  Heading,
  useToast,
} from '@chakra-ui/react';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { IoClose } from 'react-icons/io5';
import { supabase } from '../../Utils/supabaseClient';
import SummaryConfig from './SummaryConfig';
import PriceListConfig from './PriceListConfig';

interface ConfigurationSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

function ConfigurationSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
}: ConfigurationSidebarProps) {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState('summary');
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

  const toast = useToast();

  useEffect(() => {
    if (isSidebarOpen === false) {
      setIsAuthenticated(false);
    }
  }, [isSidebarOpen]);

  // Function to handle password submission
  const handleAuth = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('password')
      .eq('username', 'admin')
      .single();

    if (error) {
      setWrongPassword(true);
      setIsAuthenticated(false);
      setIsSidebarOpen(false);
    } else if (data && data.password === password) {
      setIsAuthenticated(true);
      setIsSidebarOpen(true);
      setPassword('');
      setWrongPassword(false);
      onClose();
    } else {
      setWrongPassword(true);
      setIsAuthenticated(false);
      setIsSidebarOpen(false);
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

    const { data, error } = await supabase
      .from('users')
      .select('password')
      .eq('username', 'admin')
      .single();

    if (error || !data) {
      setPasswordChangeError('Error fetching user data.');
      return;
    }

    if (data.password !== oldPassword) {
      setPasswordChangeError('Old password is incorrect.');
      return;
    }

    // Update the password in the database
    const { updateError } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('username', 'admin');

    if (updateError) {
      setPasswordChangeError('Error updating password.');
    } else {
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordChangeError('');
      toast({
        title: 'Success.',
        description: 'Password changed successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSelectChange = (e) => {
    setSelectedConfig(e.target.value);
  };

  // Open password modal when sidebar opens
  React.useEffect(() => {
    if (isSidebarOpen && !isAuthenticated) {
      onOpen();
    }
  }, [isSidebarOpen, isAuthenticated, onOpen]);

  return (
    <Box
      right="0"
      top="0"
      display="flex"
      flexDirection="column"
      borderLeft="3px solid #cf3350"
      position="absolute"
      transition="width 0.5s"
      height="calc(100vh)"
      width={isSidebarOpen && isAuthenticated ? '40%' : '0'}
      zIndex="1000"
      bg="#f1f1f1"
    >
      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (!isAuthenticated) {
            setIsSidebarOpen(false);
          }
          onClose();
        }}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Verify Admin Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {' '}
            {wrongPassword && (
              <Box mt={2} padding="10px" borderRadius="15px">
                <Text fontWeight="bold" fontSize="14px" color="#cf3350">
                  Incorrect password, please try again.
                </Text>
              </Box>
            )}
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAuth();
                }
              }}
              border="none"
              borderRadius="0px"
              color="black"
              fontWeight="bold"
              fontSize="18px"
              borderBottom="2px solid black"
              _focus={{
                borderBottom: '3px solid black',
                boxShadow: 'none',
              }}
              _hover={{
                borderBottom: '3px solid black',
              }}
              _placeholder={{
                color: 'black',
                opacity: '0.6',
                fontSize: '18px',
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              background="#cf3350"
              color="white"
              borderRadius="15px"
              onClick={handleAuth}
              _hover={{ opacity: '0.6' }}
            >
              Submit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {isAuthenticated && (
        <>
          <Box
            bg="#cf3350"
            display="flex"
            width="100%"
            height="60px"
            justifyContent="space-between"
            alignItems="center"
            p={3}
          >
            <Text fontWeight="bold" fontSize="20px" color="white">
              Configuration Menu
            </Text>
            <Button
              onClick={() => setIsSidebarOpen(false)}
              variant="ghost"
              _hover={{ variant: 'ghost' }}
              borderRadius="25px"
            >
              <IoClose color="white" size="30px" />
            </Button>
          </Box>

          <Box p={4} overflowY="auto">
            <Select
              value={selectedConfig}
              onChange={handleSelectChange}
              mb="25px"
              border="none"
              borderBottom="2px solid #cf3350"
              borderRadius="0px"
              background="white"
              _hover={{
                borderBottom: '2px solid #cf3350',
                cursor: 'pointer',
                background: '#dedede',
              }}
              _focus={{
                borderBottom: '2px solid #cf3350',
                boxShadow: 'none',
              }}
              fontWeight="bold"
            >
              <option value="summary">Summary Configuration</option>
              <option value="price_list">Price List Configuration</option>
              <option value="settings">Settings</option>
            </Select>
            {selectedConfig === 'summary' && (
              <SummaryConfig setIsSidebarOpen={setIsSidebarOpen} />
            )}
            {selectedConfig === 'price_list' && (
              <PriceListConfig setIsSidebarOpen={setIsSidebarOpen} />
            )}
            {selectedConfig === 'settings' && (
              <Box mt={4}>
                <Heading size="sm" textAlign="left">
                  QC Authorization
                </Heading>

                {passwordChangeError && (
                  <Text color="#cf3350" mt="30px">
                    {passwordChangeError}
                  </Text>
                )}

                {/* Old Password Input */}
                <Text
                  mb={1}
                  mt="20px"
                  textAlign="left"
                  fontWeight="bold"
                  color="#7c7c7c"
                  fontSize="14px"
                >
                  Old Password:
                </Text>
                <InputGroup mb={3}>
                  <Input
                    type={showOldPassword ? 'text' : 'password'}
                    placeholder="Old Password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    border="none"
                    borderRadius="0px"
                    color="#cf3350"
                    fontWeight="bold"
                    fontSize="14px"
                    borderBottom="2px solid #cf3350"
                    _focus={{
                      borderBottom: '3px solid #cf3350',
                      boxShadow: 'none',
                    }}
                    _hover={{
                      borderBottom: '3px solid #cf3350',
                    }}
                    _placeholder={{
                      color: '#cf3350',
                      opacity: '0.6',
                      fontSize: '12px',
                    }}
                  />
                  <InputRightElement>
                    <Button
                      variant="link"
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

                {/* New Password Input */}
                <Text
                  mb={1}
                  mt="20px"
                  color="#7c7c7c"
                  textAlign="left"
                  fontWeight="bold"
                  fontSize="14px"
                >
                  New Password:
                </Text>
                <InputGroup mb={3}>
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    border="none"
                    borderRadius="0px"
                    color="#cf3350"
                    fontWeight="bold"
                    fontSize="14px"
                    borderBottom="2px solid #cf3350"
                    _focus={{
                      borderBottom: '3px solid #cf3350',
                      boxShadow: 'none',
                    }}
                    _hover={{
                      borderBottom: '3px solid #cf3350',
                    }}
                    _placeholder={{
                      color: '#cf3350',
                      opacity: '0.6',
                      fontSize: '12px',
                    }}
                  />
                  <InputRightElement>
                    <Button
                      variant="link"
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

                {/* Confirm New Password Input */}
                <Text
                  mb={1}
                  color="#7c7c7c"
                  mt="20px"
                  textAlign="left"
                  fontWeight="bold"
                  fontSize="14px"
                >
                  Confirm New Password:
                </Text>
                <InputGroup mb={3}>
                  <Input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    placeholder="Confirm New Password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    border="none"
                    borderRadius="0px"
                    color="#cf3350"
                    fontWeight="bold"
                    fontSize="14px"
                    borderBottom="2px solid #cf3350"
                    _focus={{
                      borderBottom: '3px solid #cf3350',
                      boxShadow: 'none',
                    }}
                    _hover={{
                      borderBottom: '3px solid #cf3350',
                    }}
                    _placeholder={{
                      color: '#cf3350',
                      opacity: '0.6',
                      fontSize: '12px',
                    }}
                  />
                  <InputRightElement>
                    <Button
                      variant="link"
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

                <Button
                  bg="#cf3350"
                  color="white"
                  _hover={{ opacity: 0.5 }}
                  onClick={handlePasswordChange}
                >
                  Change Password
                </Button>
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}

export default ConfigurationSidebar;
