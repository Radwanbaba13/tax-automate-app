import React from 'react';
import { Box, Flex, Heading, VStack } from '@chakra-ui/react';
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
        bg="gray.50"
      >
        {/* Header with Breadcrumb and Page Title - Hidden on Home Page */}
        {!isHomePage && (
          <Box
            bg="white"
            borderBottom="1px solid"
            borderColor="gray.200"
            height="100px"
            px={8}
            py={5}
          >
            <VStack align="flex-start" spacing={2}>
              <Breadcrumb />
              <Heading size="lg" color="gray.800">
                {pageTitle}
              </Heading>
            </VStack>
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
