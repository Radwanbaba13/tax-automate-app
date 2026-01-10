import React from 'react';
import { Box, VStack, Text, Divider } from '@chakra-ui/react';
import { Card } from '../../common';
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
    <Card flex={1} minH="500px">
      <VStack spacing={4} align="stretch">
        <Text fontSize="md" fontWeight="600" color="gray.700">
          Client Files
        </Text>
        <Divider borderColor="gray.300" />
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
          >
            <Text fontSize="md" fontWeight="600" color="gray.600" mb={2}>
              No files selected
            </Text>
            <Text fontSize="sm" color="gray.500">
              Please select PDF files to process by clicking the upload button
            </Text>
          </Box>
        )}
      </VStack>
    </Card>
  );
}

export default ClientFilesList;
