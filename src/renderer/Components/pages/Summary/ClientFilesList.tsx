import React from 'react';
import { Box, VStack, Text } from '@chakra-ui/react';
import { MdPeopleAlt } from 'react-icons/md';
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
      minH="500px"
      icon={<MdPeopleAlt size={18} />}
      title="Client Files"
      subtitle={
        clientFiles.length > 0
          ? `${clientFiles.length} file${clientFiles.length !== 1 ? 's' : ''}`
          : undefined
      }
      contentProps={{ p: 4 }}
    >
      <VStack spacing={4} align="stretch">
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
            textAlign="center"
            bg="gray.50"
            p={8}
            borderRadius="md"
            border="1px dashed"
            borderColor="gray.300"
            _dark={{ bg: '#151515', borderColor: '#3a3a3a' }}
          >
            <Text
              fontSize="md"
              fontWeight="600"
              color="gray.600"
              mb={2}
              _dark={{ color: 'gray.100' }}
            >
              No files selected
            </Text>
            <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.300' }}>
              Please select PDF files to process by clicking the upload button
            </Text>
          </Box>
        )}
      </VStack>
    </SectionCard>
  );
}

export default ClientFilesList;
