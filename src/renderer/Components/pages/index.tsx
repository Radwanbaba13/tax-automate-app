import React from 'react';
import {
  Box,
  SimpleGrid,
  VStack,
  Heading,
  Text,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { MdEmail } from 'react-icons/md';
import { IoDocuments } from 'react-icons/io5';
import { FaFileInvoiceDollar } from 'react-icons/fa';
import { VscOpenPreview } from 'react-icons/vsc';
import { IconType } from 'react-icons';

interface NavigationCardProps {
  icon: IconType;
  title: string;
  description: string;
  route: string;
  color: string;
}

const NAVIGATION_CARDS = [
  {
    icon: IoDocuments,
    title: 'Summary',
    description:
      'Generate comprehensive summary documents from PDF files with customizable configurations',
    route: '/summary',
    color: '#cf3350',
  },
  {
    icon: FaFileInvoiceDollar,
    title: 'Confirmation',
    description:
      'Create professional confirmation documents and invoices with detailed client information',
    route: '/confirmation',
    color: '#386498',
  },
  {
    icon: VscOpenPreview,
    title: 'Data Review',
    description:
      'Review and validate all processed data before generating final documents',
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

function NavigationCard({
  icon,
  title,
  description,
  route,
  color,
}: NavigationCardProps) {
  const navigate = useNavigate();

  return (
    <Box
      w="100%"
      p={{ base: 6, md: 8, lg: 10 }}
      borderRadius="xl"
      border="2px solid"
      borderColor="gray.200"
      bg="white"
      cursor="pointer"
      onClick={() => navigate(route)}
      transition="all 0.3s ease"
      _hover={{
        transform: 'translateY(-8px)',
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
        borderColor: color,
        bg: 'gray.50',
      }}
      minH="240px"
    >
      <VStack spacing={{ base: 3, md: 4 }} align="center" textAlign="center">
        <Box
          p={{ base: 3, md: 4 }}
          borderRadius="full"
          bg={`${color}15`}
          color={color}
          transition="all 0.3s"
        >
          <Icon as={icon} boxSize={{ base: 10, md: 12, lg: 14 }} />
        </Box>
        <Heading size={{ base: 'md', md: 'lg' }} color="gray.800">
          {title}
        </Heading>
        <Text color="gray.600" fontSize={{ base: 'sm', md: 'md' }}>
          {description}
        </Text>
      </VStack>
    </Box>
  );
}

function HomePage() {
  const [version, setVersion] = React.useState('');

  React.useEffect(() => {
    window.electron.getAppVersion().then((v: string) => {
      setVersion(v);
    });
  }, []);

  return (
    <Box w="100%" h="100vh" bg="gray.50" display="flex" flexDirection="column">
      {/* Header Bar */}
      <Box
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        py={{ base: 4, md: 6 }}
        textAlign="center"
        height="100px"
      >
        <Heading
          size={{ base: 'lg', md: 'xl', lg: '2xl' }}
          color="gray.800"
          fontWeight="700"
          mb={2}
        >
          Tax Automation Modules
        </Heading>
      </Box>

      {/* Subtitle Section */}
      <Box textAlign="center" py={4} bg="gray.50">
        <Text fontSize="xl" color="gray.600" mb={2}>
          Select a module below to get started
        </Text>
        {version && (
          <HStack spacing={2} justify="center">
            <Text fontSize="md" color="gray.500">
              Version {version}
            </Text>
          </HStack>
        )}
      </Box>

      {/* Cards Grid */}
      <Box
        flex="1"
        p={{ base: 8, md: 10, lg: 12 }}
        overflow="auto"
        bg="gray.50"
      >
        <SimpleGrid
          columns={{ base: 1, lg: 2 }}
          spacing={{ base: 6, md: 8 }}
          maxW="1600px"
          mx="auto"
        >
          {NAVIGATION_CARDS.map((card) => (
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
      </Box>
    </Box>
  );
}

export default HomePage;
