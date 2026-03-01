import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Image,
  Divider,
  Spinner,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { MdEmail, MdSettings } from 'react-icons/md';
import { IoDocuments } from 'react-icons/io5';
import { FaFileInvoiceDollar } from 'react-icons/fa';
import { VscOpenPreview } from 'react-icons/vsc';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

import { IconType } from 'react-icons';
import LogoImage from '../../../../assets/Logo.png';
import UpdateModal from '../modals/UpdateModal';

interface NavItemProps {
  icon: IconType;
  label: string;
  to: string;
  isActive: boolean;
}

function NavItem({ icon, label, to, isActive }: NavItemProps) {
  const inactiveColor = useColorModeValue('gray.700', 'gray.200');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const activeBg = useColorModeValue('#cf335010', 'rgba(207, 51, 80, 0.18)');
  const activeHoverBg = useColorModeValue(
    '#cf335015',
    'rgba(207, 51, 80, 0.24)',
  );

  return (
    <Link to={to} style={{ width: '100%', textDecoration: 'none' }}>
      <HStack
        px={2}
        py={2}
        cursor="pointer"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? '#cf3350' : inactiveColor}
        fontWeight={isActive ? '600' : '500'}
        borderLeft={isActive ? '3px solid' : '3px solid transparent'}
        borderColor={isActive ? '#cf3350' : 'transparent'}
        _hover={{
          bg: isActive ? activeHoverBg : hoverBg,
          transform: 'translateX(4px)',
        }}
        transition="all 0.2s ease"
        spacing={3}
      >
        <Icon as={icon} boxSize={5} />
        <Text fontSize="sm">{label}</Text>
      </HStack>
    </Link>
  );
}

function Sidebar() {
  const location = useLocation();
  const [version, setVersion] = React.useState('');
  const [isCheckingUpdate, setIsCheckingUpdate] = React.useState(false);
  const [updateStatus, setUpdateStatus] = React.useState<
    'idle' | 'up-to-date' | 'update-available' | 'error'
  >('idle');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = React.useState(false);

  const handleCheckForUpdates = React.useCallback(async () => {
    setIsCheckingUpdate(true);
    setUpdateStatus('idle');
    try {
      const result = await window.electron.checkForUpdates();

      // Handle development mode response
      if (result && !result.available && result.message) {
        setUpdateStatus('up-to-date');
        setIsCheckingUpdate(false);
        return;
      }

      // If there's an error in the result
      if (result && result.error) {
        setUpdateStatus('error');
        setIsCheckingUpdate(false);
        return;
      }

      // The update events will handle setting the status for production builds
      // If no events fire within 10 seconds, assume up to date
      setTimeout(() => {
        setIsCheckingUpdate((checking) => {
          if (checking) {
            setUpdateStatus('up-to-date');
            return false;
          }
          return checking;
        });
      }, 10000);
    } catch (error) {
      setUpdateStatus('error');
      setIsCheckingUpdate(false);
    }
  }, []);

  React.useEffect(() => {
    window.electron.getAppVersion().then((v: any) => {
      setVersion(v);
    });

    // Listen for update events
    window.electron.onUpdateAvailable(() => {
      setUpdateStatus('update-available');
      setIsCheckingUpdate(false);
    });

    window.electron.onUpdateNotAvailable(() => {
      setUpdateStatus('up-to-date');
      setIsCheckingUpdate(false);
    });

    window.electron.onUpdateError(() => {
      setUpdateStatus('error');
      setIsCheckingUpdate(false);
    });

    // Automatically check for updates on load
    handleCheckForUpdates();
  }, [handleCheckForUpdates]);

  const mainNavItems = [
    { icon: IoDocuments, label: 'Summary', to: '/summary' },
    { icon: FaFileInvoiceDollar, label: 'Confirmation', to: '/confirmation' },
    { icon: VscOpenPreview, label: 'Data Review', to: '/data-review' },
    { icon: MdEmail, label: 'Email Automation', to: '/email-automation' },
  ];

  return (
    <Box
      w="220px"
      h="100vh"
      bg={useColorModeValue('white', '#151515')}
      borderRight="1px solid"
      borderColor={useColorModeValue('gray.200', '#2a2a2a')}
      position="fixed"
      left={0}
      top={0}
      display="flex"
      flexDirection="column"
      boxShadow="sm"
    >
      {/* Logo Section */}
      <Box
        px={6}
        py={2}
        borderBottom="1px solid"
        borderColor="gray.200"
        height="100px"
      >
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Image
            src={LogoImage}
            alt="Tax Automation Logo"
            h="75px"
            objectFit="contain"
            cursor="pointer"
            transition="all 0.2s"
            justifySelf="center"
            _hover={{ opacity: 0.8 }}
          />
        </Link>
      </Box>

      {/* Main Navigation */}
      <VStack flex={1} spacing={3} px={4} py={6} align="stretch">
        <Text
          fontSize="xs"
          fontWeight="600"
          color="gray.500"
          textTransform="uppercase"
          letterSpacing="wide"
        >
          Workspaces
        </Text>
        {mainNavItems.map((item) => (
          <NavItem
            key={item.to}
            icon={item.icon}
            label={item.label}
            to={item.to}
            isActive={location.pathname === item.to}
          />
        ))}
      </VStack>

      {/* Bottom Section - Admin Settings & Version */}
      <Box px={4} pb={4}>
        <Divider mb={4} borderColor="gray.300" />
        <NavItem
          icon={MdSettings}
          label="Admin Settings"
          to="/admin-settings"
          isActive={location.pathname === '/admin-settings'}
        />

        {/* Version and Update Status */}
        <Box mt={4} px={2} py={3} borderTop="1px solid" borderColor="gray.200">
          <VStack spacing={2} align="stretch">
            <Text fontSize="xs" fontWeight="600" color="gray.500">
              Version {version}
            </Text>

            {updateStatus === 'idle' && !isCheckingUpdate && (
              <Text
                fontSize="xs"
                color="blue.600"
                cursor="pointer"
                fontWeight="500"
                onClick={handleCheckForUpdates}
                _hover={{ color: 'blue.700', textDecoration: 'underline' }}
              >
                Check for updates
              </Text>
            )}

            {isCheckingUpdate && (
              <HStack spacing={2}>
                <Spinner size="xs" color="blue.500" />
                <Text fontSize="xs" color="gray.600">
                  Checking...
                </Text>
              </HStack>
            )}

            {updateStatus === 'up-to-date' && (
              <HStack spacing={1}>
                <Icon as={FiCheckCircle} boxSize={3} color="green.500" />
                <Text fontSize="xs" color="green.600" fontWeight="500">
                  Up to date
                </Text>
              </HStack>
            )}

            {updateStatus === 'update-available' && (
              <Button
                size="xs"
                colorScheme="orange"
                onClick={() => setIsUpdateModalOpen(true)}
                leftIcon={<Icon as={FiAlertCircle} boxSize={3} />}
              >
                Update Now
              </Button>
            )}

            {updateStatus === 'error' && (
              <Text
                fontSize="xs"
                color="gray.500"
                cursor="pointer"
                onClick={handleCheckForUpdates}
                _hover={{ textDecoration: 'underline' }}
              >
                Check again
              </Text>
            )}
          </VStack>
        </Box>
      </Box>

      {/* Update Modal */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />
    </Box>
  );
}

export default Sidebar;
