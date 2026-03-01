import React from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  VStack,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiMoon, FiSun } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Breadcrumb from './Breadcrumb';

interface MainLayoutProps {
  children: React.ReactNode;
}

const routeTitles: Record<string, string> = {
  '/': 'Home',
  '/summary': 'Summary Tool',
  '/confirmation': 'Confirmation & Invoice',
  '/data-review': 'Data Review',
  '/email-automation': 'Email Automation',
  '/admin-settings': 'Admin Settings',
};

const SIDEBAR_WIDTH = '220px';

function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const pageTitle = routeTitles[location.pathname] || 'Page';
  const isHomePage = location.pathname === '/';
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box position="relative" h="100vh" w="100vw" overflow="hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <Box
        position="absolute"
        left={SIDEBAR_WIDTH}
        top={0}
        right={0}
        bottom={0}
        overflowY="auto"
        bg={useColorModeValue('gray.50', '#101010')}
      >
        {/* Header with Breadcrumb and Page Title - Hidden on Home Page */}
        {!isHomePage && (
          <Box
            bg={useColorModeValue('white', '#181818')}
            borderBottom="1px solid"
            borderColor={useColorModeValue('gray.200', '#2a2a2a')}
            height="100px"
            px={8}
            py={5}
          >
            <Flex align="center" justify="space-between" h="full">
              <VStack align="flex-start" spacing={2}>
                <Breadcrumb />
                <Heading
                  size="lg"
                  color={useColorModeValue('gray.800', 'white')}
                >
                  {pageTitle}
                </Heading>
              </VStack>
              <Button
                onClick={toggleColorMode}
                variant="ghost"
                leftIcon={colorMode === 'light' ? <FiMoon size={15} /> : <FiSun size={15} />}
                size="sm"
                fontWeight="500"
                borderRadius="8px"
                color={useColorModeValue('gray.600', 'gray.300')}
                _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                px={3}
              >
                {colorMode === 'light' ? 'Dark Mode' : 'Light Mode'}
              </Button>
            </Flex>
          </Box>
        )}

        {/* Page Content */}
        <Box p={!isHomePage ? 8 : 0} w="100%">
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default MainLayout;
