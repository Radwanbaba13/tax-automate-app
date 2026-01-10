import React from 'react';
import { Box, VStack, HStack, Text, Input } from '@chakra-ui/react';
import { FaFolderOpen } from 'react-icons/fa';
import { Card } from '../../common';

interface DirectorySelectorProps {
  directory: string | null;
  onSelectDirectory: () => void;
}

function DirectorySelector({
  directory,
  onSelectDirectory,
}: DirectorySelectorProps) {
  return (
    <Card width="100%">
      <VStack spacing={2} align="stretch">
        <Text fontSize="md" fontWeight="600" color="gray.700">
          Save Directory
        </Text>
        <HStack
          border="2px solid"
          borderColor="brand.500"
          borderRadius="md"
          cursor="pointer"
          onClick={onSelectDirectory}
          fontSize="14px"
          padding={4}
          height="45px"
          _hover={{ bg: 'gray.50' }}
        >
          <FaFolderOpen size={18} color="#cf3350" />
          <Input
            placeholder="Select save directory"
            value={directory || ''}
            isReadOnly
            border="none"
            cursor="pointer"
            _focus={{ boxShadow: 'none' }}
          />
        </HStack>
      </VStack>
    </Card>
  );
}

export default DirectorySelector;
