import React from 'react';
import { HStack, Text } from '@chakra-ui/react';
import { FaFolderOpen } from 'react-icons/fa';
import SectionCard from '../../common/SectionCard';

interface DirectorySelectorProps {
  directory: string | null;
  onSelectDirectory: () => void;
}

function DirectorySelector({
  directory,
  onSelectDirectory,
}: DirectorySelectorProps) {
  return (
    <SectionCard
      width="100%"
      icon={<FaFolderOpen size={16} />}
      title="Save Directory"
      contentProps={{ p: 4 }}
    >
      <HStack
        border="1.5px solid #e2e8f0"
        borderRadius="8px"
        cursor="pointer"
        onClick={onSelectDirectory}
        px={3}
        py="8px"
        spacing={2}
        _hover={{ borderColor: '#cf3350', bg: '#fff8f9' }}
        transition="all 0.15s"
      >
        <FaFolderOpen size={15} color="#cf3350" style={{ flexShrink: 0 }} />
        <Text
          fontSize="13px"
          color={directory ? 'gray.700' : 'gray.400'}
          noOfLines={1}
          flex="1"
        >
          {directory || 'Click to select a save directory...'}
        </Text>
      </HStack>
    </SectionCard>
  );
}

export default DirectorySelector;
