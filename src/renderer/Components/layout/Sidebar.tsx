import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Image,
  Divider,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import {
  MdSummarize,
  MdDescription,
  MdDataset,
  MdEmail,
  MdSettings,
} from 'react-icons/md';
import { IconType } from 'react-icons';
import LogoImage from '../../../../assets/Logo.png';

interface NavItemProps {
  icon: IconType;
  label: string;
  to: string;
  isActive: boolean;
}

function NavItem({ icon, label, to, isActive }: NavItemProps) {
  return (
    <Link to={to} style={{ width: '100%', textDecoration: 'none' }}>
      <HStack
        px={4}
        py={3}
        borderRadius="lg"
        cursor="pointer"
        bg={isActive ? '#cf335010' : 'transparent'}
        color={isActive ? '#cf3350' : 'gray.700'}
        fontWeight={isActive ? '600' : '500'}
        borderLeft={isActive ? '3px solid' : '3px solid transparent'}
        borderColor={isActive ? '#cf3350' : 'transparent'}
        _hover={{
          bg: isActive ? '#cf335015' : 'gray.50',
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

  const mainNavItems = [
    { icon: MdSummarize, label: 'Summary', to: '/summary' },
    { icon: MdDescription, label: 'Confirmation', to: '/confirmation' },
    { icon: MdDataset, label: 'Data Review', to: '/data-review' },
    { icon: MdEmail, label: 'Email Automation', to: '/email-automation' },
  ];

  return (
    <Box
      w="260px"
      h="100vh"
      bg="white"
      borderRight="1px solid"
      borderColor="gray.200"
      position="fixed"
      left={0}
      top={0}
      display="flex"
      flexDirection="column"
      boxShadow="sm"
    >
      {/* Logo Section */}
      <Box px={6} py={6} borderBottom="1px solid" borderColor="gray.200">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Image
            src={LogoImage}
            alt="Tax Automation Logo"
            h="50px"
            objectFit="contain"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ opacity: 0.8 }}
          />
        </Link>
      </Box>

      {/* Main Navigation */}
      <VStack flex={1} spacing={2} px={4} py={6} align="stretch">
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

      {/* Bottom Section - Admin Settings */}
      <Box px={4} pb={6}>
        <Divider mb={4} />
        <NavItem
          icon={MdSettings}
          label="Admin Settings"
          to="/admin-settings"
          isActive={location.pathname === '/admin-settings'}
        />
      </Box>
    </Box>
  );
}

export default Sidebar;
