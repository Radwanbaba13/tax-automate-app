import { VStack, Heading, Text, Icon } from '@chakra-ui/react';
import React from 'react';
import { IconType } from 'react-icons';

interface EmptyStateProps {
  icon?: IconType;
  title: string;
  description?: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <VStack spacing={4} py={12} color="gray.500">
      {icon && <Icon as={icon} boxSize={16} color="gray.400" />}
      <Heading size="md" color="gray.600">
        {title}
      </Heading>
      {description && (
        <Text textAlign="center" maxW="md">
          {description}
        </Text>
      )}
    </VStack>
  );
}

export default EmptyState;
