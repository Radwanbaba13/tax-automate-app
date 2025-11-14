import React from 'react';
import {
  Box,
  SimpleGrid,
  VStack,
  Heading,
  Text,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { MdDescription, MdDataset, MdEmail, MdSummarize } from 'react-icons/md';
import { IconType } from 'react-icons';

interface NavigationCardProps {
  icon: IconType;
  title: string;
  description: string;
  route: string;
  color: string;
}

function NavigationCard({
  icon,
  title,
  description,
  route,
  color,
}: NavigationCardProps) {
  const navigate = useNavigate();
  const bgHover = useColorModeValue('gray.50', 'gray.700');

  return (
    <Box
      w="100%"
      p={8}
      borderRadius="xl"
      border="2px solid"
      borderColor="gray.200"
      bg="white"
      cursor="pointer"
      onClick={() => navigate(route)}
      transition="all 0.3s ease"
      _hover={{
        transform: 'translateY(-8px)',
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
        borderColor: color,
        bg: bgHover,
      }}
      height="100%"
    >
      <VStack spacing={4} align="center" textAlign="center">
        <Box
          p={4}
          borderRadius="full"
          bg={`${color}15`}
          color={color}
          transition="all 0.3s"
        >
          <Icon as={icon} boxSize={12} />
        </Box>
        <Heading size="md" color="gray.800">
          {title}
        </Heading>
        <Text color="gray.600" fontSize="sm">
          {description}
        </Text>
      </VStack>
    </Box>
  );
}

function HomePage() {
  const navigationCards = [
    {
      icon: MdSummarize,
      title: 'Summary',
      description:
        'Generate summary documents from PDF files with customizable configurations',
      route: '/summary',
      color: '#cf3350',
    },
    {
      icon: MdDescription,
      title: 'Confirmation',
      description:
        'Create confirmation documents and invoices with detailed client information',
      route: '/confirmation',
      color: '#386498',
    },
    {
      icon: MdDataset,
      title: 'Data Review',
      description:
        'Review and validate processed data before generating documents',
      route: '/data-review',
      color: '#2D7A3E',
    },
    {
      icon: MdEmail,
      title: 'Email Automation',
      description:
        'Automate email sending with customizable templates and attachments',
      route: '/email-automation',
      color: '#D97706',
    },
  ];

  return (
    <Box maxW="1400px" mx="auto">
      <VStack spacing={8} align="stretch">
        <Box textAlign="center" py={8}>
          <Heading size="2xl" color="gray.800" mb={4}>
            Welcome to Tax Automation
          </Heading>
          <Text fontSize="lg" color="gray.600">
            Select a module below to get started
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={8}>
          {navigationCards.map((card) => (
            <NavigationCard
              key={card.route}
              icon={card.icon}
              title={card.title}
              description={card.description}
              route={card.route}
              color={card.color}
            />
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  );
}

export default HomePage;
