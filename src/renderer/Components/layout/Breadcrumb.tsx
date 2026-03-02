import React from 'react';
import {
  Breadcrumb as ChakraBreadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { MdChevronRight } from 'react-icons/md';

const routeNames: Record<string, string> = {
  '/': 'Home',
  '/summary': 'Summary',
  '/confirmation': 'Confirmation',
  '/data-review': 'Data Review',
  '/email-automation': 'Email Automation',
  '/admin-settings': 'Admin Settings',
};

function Breadcrumb() {
  const location = useLocation();
  const currentPath = location.pathname;
  const pageName = routeNames[currentPath] || 'Page';

  const linkColor = useColorModeValue('gray.600', 'gray.300');
  const currentColor = useColorModeValue('gray.700', 'gray.100');
  const separatorColor = useColorModeValue('gray.400', 'gray.500');

  return (
    <ChakraBreadcrumb
      spacing={2}
      separator={<MdChevronRight color={separatorColor} />}
      fontSize="sm"
      color={linkColor}
    >
      <BreadcrumbItem>
        <BreadcrumbLink as={Link} to="/" fontWeight="500" color={linkColor}>
          Home
        </BreadcrumbLink>
      </BreadcrumbItem>
      {currentPath !== '/' && (
        <BreadcrumbItem isCurrentPage>
          <Text fontWeight="500" color={currentColor}>
            {pageName}
          </Text>
        </BreadcrumbItem>
      )}
    </ChakraBreadcrumb>
  );
}

export default Breadcrumb;
