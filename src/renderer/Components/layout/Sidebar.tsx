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
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { MdEmail, MdSettings } from 'react-icons/md';
import { IoDocuments } from 'react-icons/io5';
import { FaFileInvoiceDollar } from 'react-icons/fa';
import { VscOpenPreview } from 'react-icons/vsc';
import { FiCheckCircle, FiAlertCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

import { IconType } from 'react-icons';
import LogoImage from '../../../../assets/Logo.png';
import IconImage from '../../../../assets/icon.png';
import UpdateModal from '../modals/UpdateModal';

interface NavItemProps {
  icon: IconType;
  label: string;
  to: string;
  isActive: boolean;
  isOpen: boolean;
}

function NavItem({ icon, label, to, isActive, isOpen }: NavItemProps) {
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
        px={isOpen ? 2 : 0}
        py={2}
        cursor="pointer"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? '#cf3350' : inactiveColor}
        fontWeight={isActive ? '600' : '500'}
        borderLeft={isActive ? '3px solid' : '3px solid transparent'}
        borderColor={isActive ? '#cf3350' : 'transparent'}
        justify={isOpen ? 'flex-start' : 'center'}
        _hover={{
          bg: isActive ? activeHoverBg : hoverBg,
          transform: isOpen ? 'translateX(4px)' : 'none',
        }}
        transition="all 0.2s ease"
        spacing={isOpen ? 3 : 0}
      >
        <Icon as={icon} boxSize={5} flexShrink={0} />
        <Box
          overflow="hidden"
          maxW={isOpen ? '160px' : '0px'}
          transition="max-width 0.25s ease, opacity 0.2s ease"
          opacity={isOpen ? 1 : 0}
          whiteSpace="nowrap"
        >
          <Text fontSize="sm">{label}</Text>
        </Box>
      </HStack>
    </Link>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const [version, setVersion] = React.useState('');
  const [isCheckingUpdate, setIsCheckingUpdate] = React.useState(false);
  const [updateStatus, setUpdateStatus] = React.useState<
    'idle' | 'up-to-date' | 'update-available' | 'error'
  >('idle');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = React.useState(false);

  const toggleBg = useColorModeValue('white', '#1e1e1e');
  const toggleBorder = useColorModeValue('gray.200', '#2a2a2a');
  const toggleColor = useColorModeValue('gray.500', 'gray.400');
  const toggleHover = useColorModeValue('gray.50', '#2a2a2a');

  const handleCheckForUpdates = React.useCallback(async () => {
    setIsCheckingUpdate(true);
    setUpdateStatus('idle');
    try {
      const result = await window.electron.checkForUpdates();

      if (result && !result.available && result.message) {
        setUpdateStatus('up-to-date');
        setIsCheckingUpdate(false);
        return;
      }

      if (result && result.error) {
        setUpdateStatus('error');
        setIsCheckingUpdate(false);
        return;
      }

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
      position="fixed"
      left={0}
      top={0}
      h="100vh"
      w={isOpen ? '220px' : '64px'}
      transition="width 0.25s ease"
      zIndex={10}
    >
      <Box
        w="100%"
        h="100%"
        bg={useColorModeValue('white', '#151515')}
        borderRight="1px solid"
        borderColor={useColorModeValue('gray.200', '#2a2a2a')}
        display="flex"
        flexDirection="column"
        boxShadow="sm"
        overflow="hidden"
      >
        <Box
          px={isOpen ? 6 : 0}
          py={2}
          borderBottom="1px solid"
          borderColor="gray.200"
          height="100px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          transition="padding 0.25s ease"
        >
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Image
              src={isOpen ? LogoImage : IconImage}
              alt="Tax Automation Logo"
              h={isOpen ? '75px' : '36px'}
              w={isOpen ? 'auto' : '36px'}
              objectFit="contain"
              cursor="pointer"
              transition="height 0.25s ease, width 0.25s ease"
              _hover={{ opacity: 0.8 }}
            />
          </Link>
        </Box>

        <VStack
          flex={1}
          spacing={3}
          px={isOpen ? 4 : 2}
          py={6}
          align="stretch"
          transition="padding 0.25s ease"
        >
          <Box
            overflow="hidden"
            maxH={isOpen ? '20px' : '0px'}
            opacity={isOpen ? 1 : 0}
            transition="max-height 0.25s ease, opacity 0.2s ease"
          >
            <Text
              fontSize="xs"
              fontWeight="600"
              color="gray.500"
              textTransform="uppercase"
              letterSpacing="wide"
            >
              Workspaces
            </Text>
          </Box>
          {mainNavItems.map((item) => (
            <NavItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              to={item.to}
              isActive={location.pathname === item.to}
              isOpen={isOpen}
            />
          ))}
        </VStack>

        <Box px={isOpen ? 4 : 2} pb={4} transition="padding 0.25s ease">
          <Divider mb={4} borderColor="gray.300" />
          <NavItem
            icon={MdSettings}
            label="Admin Settings"
            to="/admin-settings"
            isActive={location.pathname === '/admin-settings'}
            isOpen={isOpen}
          />
          <Box
            overflow="hidden"
            maxH={isOpen ? '120px' : '0px'}
            opacity={isOpen ? 1 : 0}
            transition="max-height 0.25s ease, opacity 0.2s ease"
          >
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
        </Box>
      </Box>

      <IconButton
        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        icon={isOpen ? <FiChevronLeft size={13} /> : <FiChevronRight size={13} />}
        onClick={onToggle}
        position="absolute"
        right="-12px"
        top="29px"
        w="24px"
        h="24px"
        minW="24px"
        borderRadius="full"
        bg={toggleBg}
        color={toggleColor}
        border="1px solid"
        borderColor={toggleBorder}
        boxShadow="sm"
        _hover={{ bg: toggleHover, color: 'gray.700' }}
        zIndex={20}
        size="xs"
      />

      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />
    </Box>
  );
}

export default Sidebar;
