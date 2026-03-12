import React from 'react';
import { Box, VStack, Text, Icon } from '@chakra-ui/react';
import { MdPeopleAlt, MdUploadFile } from 'react-icons/md';
import SectionCard from '../../common/SectionCard';
import ClientFileCard from './ClientFileCard';

interface ClientFile {
  label: string;
  title: string;
  coupleWith: string;
  isNewcomer: boolean;
  isPrimary: boolean;
  isMailQC: boolean;
  directory: string;
}

interface ClientFilesListProps {
  clientFiles: ClientFile[];
  onUpdateFile: (index: number, updates: Partial<ClientFile>) => void;
  onRemoveFile: (index: number) => void;
  onCoupleWithChange: (index: number, selectedValue: string) => void;
}

function ClientFilesList({
  clientFiles,
  onUpdateFile,
  onRemoveFile,
  onCoupleWithChange,
}: ClientFilesListProps) {
  return (
    <SectionCard
      flex={1}
      h="100%"
      icon={<MdPeopleAlt size={18} />}
      title="Client Files"
      subtitle={
        clientFiles.length > 0
          ? `${clientFiles.length} file${clientFiles.length !== 1 ? 's' : ''}`
          : undefined
      }
      contentProps={{ p: 4, overflowY: 'auto' }}
    >
      <VStack spacing={4} align="stretch" h="100%">
        {clientFiles && clientFiles.length > 0 ? (
          clientFiles.map((fileItem, index) => (
            <ClientFileCard
              key={index}
              fileItem={fileItem}
              index={index}
              allFiles={clientFiles}
              onUpdateFile={onUpdateFile}
              onRemoveFile={onRemoveFile}
              onCoupleWithChange={onCoupleWithChange}
            />
          ))
        ) : (
          <Box
            flex={1}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
          >
            <Box
              bg="gray.100"
              _dark={{ bg: '#2a2a2a' }}
              p={4}
              borderRadius="full"
              mb={4}
            >
              <Icon as={MdUploadFile} boxSize={8} color="gray.400" _dark={{ color: 'gray.500' }} />
            </Box>
            <Text
              fontSize="sm"
              fontWeight="600"
              color="gray.500"
              mb={1}
              _dark={{ color: 'gray.300' }}
            >
              No files selected
            </Text>
            <Text fontSize="xs" color="gray.400" _dark={{ color: 'gray.500' }}>
              Select PDF files using the upload area
            </Text>
          </Box>
        )}
      </VStack>
    </SectionCard>
  );
}

export default ClientFilesList;
