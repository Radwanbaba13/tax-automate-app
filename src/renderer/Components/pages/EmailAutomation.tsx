import React from 'react';
import { VStack, Box, Heading, Text } from '@chakra-ui/react';

function EmailAutomationComponent() {
  return (
    <VStack spacing={6} align="stretch" w="100%">
      <Box
        bg="white"
        borderRadius="lg"
        boxShadow="sm"
        border="1px solid"
        borderColor="gray.200"
        p={6}
      >
        <VStack spacing={4} py={12} color="gray.500">
          <Heading size="md" color="gray.600">
            Coming Soon
          </Heading>
          <Text textAlign="center" maxW="md">
            This feature is under development
          </Text>
        </VStack>
      </Box>
    </VStack>
  );
}

export default EmailAutomationComponent;
