import { Box, VStack, Link as ChakraLink, Image } from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../../assets/Logo.png';

function NavBar() {
  const location = useLocation();

  return (
    <Box
      bg="#f1f1f1"
      display="flex"
      alignItems="center"
      justifyContent="center"
      shadow="md"
      height="125px"
    >
      <VStack
        position="absolute"
        marginLeft="40px"
        fontSize="18px"
        fontWeight="bold"
        left={0}
        alignItems="flex-start"
      >
        <ChakraLink
          as={Link}
          to="/"
          color="#cf3350"
          borderRadius="20px"
          textDecoration={location.pathname === '/' ? 'underline' : 'none'}
          _hover={{ opacity: '0.6', textDecoration: 'underline' }}
          display="inline"
        >
          Summary
        </ChakraLink>
        <ChakraLink
          as={Link}
          to="/confirmation"
          color="#cf3350"
          borderRadius="20px"
          textDecoration={
            location.pathname === '/confirmation' ? 'underline' : 'none'
          }
          _hover={{ opacity: '0.6', textDecoration: 'underline' }}
          display="inline"
        >
          Confirmation & Invoice
        </ChakraLink>
      </VStack>

      <Image src={logo} alt="logo" width="200px" />
    </Box>
  );
}

export default NavBar;
