import React from 'react';
import {
  Box,
  Button,
  SimpleGrid,
  VStack,
  Heading,
  Text,
  Icon,
  HStack,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { MdEmail } from 'react-icons/md';
import { IoDocuments } from 'react-icons/io5';
import { FaFileInvoiceDollar } from 'react-icons/fa';
import { VscOpenPreview } from 'react-icons/vsc';
import { FiMoon, FiSun } from 'react-icons/fi';
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
  const cardBg = useColorModeValue('white', '#181818');
  const cardBorder = useColorModeValue('gray.200', '#2a2a2a');
  const cardHoverBg = useColorModeValue('gray.50', '#222222');
  const titleColor = useColorModeValue('gray.800', 'gray.50');
  const descColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box
      w="100%"
      p={{ base: 6, md: 8, lg: 10 }}
      borderRadius="xl"
      border="2px solid"
      borderColor={cardBorder}
      bg={cardBg}
      cursor="pointer"
      onClick={() => navigate(route)}
      transition="all 0.3s ease"
      _hover={{
        transform: 'translateY(-8px)',
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
        borderColor: color,
        bg: cardHoverBg,
      }}
      minH="240px"
    >
      <VStack spacing={{ base: 3, md: 4 }} align="center" textAlign="center">
        <Box
          p={{ base: 3, md: 4 }}
          borderRadius="full"
          bg={`${color}20`}
          color={color}
          transition="all 0.3s"
        >
          <Icon as={icon} boxSize={{ base: 10, md: 12, lg: 14 }} />
        </Box>
        <Heading size={{ base: 'md', md: 'lg' }} color={titleColor}>
          {title}
        </Heading>
        <Text color={descColor} fontSize={{ base: 'sm', md: 'md' }}>
          {description}
        </Text>
      </VStack>
    </Box>
  );
}

function HomePage() {
  const [version, setVersion] = React.useState('');
  const { colorMode, toggleColorMode } = useColorMode();

  const pageBg = useColorModeValue('gray.50', '#101010');
  const headerBg = useColorModeValue('white', '#181818');
  const headerBorder = useColorModeValue('gray.200', '#2a2a2a');
  const titleColor = useColorModeValue('gray.800', 'gray.50');
  const subtitleColor = useColorModeValue('gray.600', 'gray.400');
  const versionColor = useColorModeValue('gray.500', 'gray.500');
  const toggleColor = useColorModeValue('gray.600', 'gray.300');
  const toggleHoverBg = useColorModeValue('gray.100', 'gray.700');

  React.useEffect(() => {
    window.electron.getAppVersion().then((v: string) => {
      setVersion(v);
    });
  }, []);

  return (
    <Box w="100%" h="100vh" bg={pageBg} display="flex" flexDirection="column">
      {/* Header Bar */}
      <Box
        bg={headerBg}
        borderBottom="1px solid"
        borderColor={headerBorder}
        py={{ base: 4, md: 6 }}
        px={6}
        height="100px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
      >
        <Heading
          size={{ base: 'lg', md: 'xl', lg: '2xl' }}
          color={titleColor}
          fontWeight="700"
        >
          Tax Automation Modules
        </Heading>
        <Button
          position="absolute"
          right={6}
          onClick={toggleColorMode}
          variant="ghost"
          leftIcon={colorMode === 'light' ? <FiMoon size={15} /> : <FiSun size={15} />}
          size="sm"
          fontWeight="500"
          borderRadius="8px"
          color={toggleColor}
          _hover={{ bg: toggleHoverBg }}
          px={3}
        >
          {colorMode === 'light' ? 'Dark Mode' : 'Light Mode'}
        </Button>
      </Box>

      {/* Subtitle Section */}
      <Box textAlign="center" py={4} bg={pageBg}>
        <Text fontSize="xl" color={subtitleColor} mb={2}>
          Select a module below to get started
        </Text>
        {version && (
          <HStack spacing={2} justify="center">
            <Text fontSize="md" color={versionColor}>
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
        bg={pageBg}
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
