import React from 'react';
import {
  Breadcrumb as ChakraBreadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Text,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { MdChevronRight } from 'react-icons/md';

const routeNames: Record<string, string> = {
  '/': 'Summary',
  '/confirmation': 'Confirmation',
  '/data-review': 'Data Review',
  '/email-automation': 'Email Automation',
  '/admin-settings': 'Admin Settings',
};

function Breadcrumb() {
  const location = useLocation();
  const currentPath = location.pathname;
  const pageName = routeNames[currentPath] || 'Page';

  return (
    <ChakraBreadcrumb
      spacing={2}
      separator={<MdChevronRight color="gray.500" />}
      fontSize="sm"
      color="gray.600"
    >
      <BreadcrumbItem>
        <BreadcrumbLink as={Link} to="/" fontWeight="500">
          Home
        </BreadcrumbLink>
      </BreadcrumbItem>
      {currentPath !== '/' && (
        <BreadcrumbItem isCurrentPage>
          <Text fontWeight="500" color="gray.700">
            {pageName}
          </Text>
        </BreadcrumbItem>
      )}
    </ChakraBreadcrumb>
  );
}

export default Breadcrumb;
