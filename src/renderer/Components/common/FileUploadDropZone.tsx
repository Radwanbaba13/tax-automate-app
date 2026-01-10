import React from 'react';
import { Box, VStack, Text, Button, Icon } from '@chakra-ui/react';
import { FiUpload, FiFileText } from 'react-icons/fi';

interface FileUploadDropZoneProps {
  title: string;
  files: File[];
  onFilesSelected: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  accept?: string;
  multiple?: boolean;
  colorScheme?: string;
  hoverBorderColor?: string;
  hoverBgColor?: string;
}

function FileUploadDropZone({
  title,
  files,
  onFilesSelected,
  onClear,
  accept = 'image/*,.pdf',
  multiple = true,
  colorScheme = 'blue',
  hoverBorderColor = 'blue.500',
  hoverBgColor = 'blue.50',
}: FileUploadDropZoneProps) {
  return (
    <Box>
      <Text fontSize="sm" fontWeight="600" color="gray.800" mb={2}>
        {title}
      </Text>
      <Box
        border="2px dashed"
        borderColor="gray.300"
        borderRadius="md"
        p={4}
        transition="all 0.2s"
        _hover={{ borderColor: hoverBorderColor, bg: hoverBgColor }}
      >
        <VStack spacing={2}>
          <Icon as={FiFileText} boxSize={8} color="gray.400" />
          {files.length > 0 ? (
            <Text color="green.600" fontWeight="600" fontSize="sm">
              {files.length} file{files.length > 1 ? 's' : ''} uploaded
            </Text>
          ) : (
            <Text color="gray.500" fontSize="xs">
              Upload PDF or Images (multiple)
            </Text>
          )}
          <Button
            leftIcon={<Icon as={FiUpload} />}
            size="sm"
            colorScheme={colorScheme}
            as="label"
            cursor="pointer"
          >
            Choose Files
            <input
              type="file"
              accept={accept}
              multiple={multiple}
              hidden
              onChange={onFilesSelected}
            />
          </Button>
          {files.length > 0 && (
            <Button
              size="xs"
              variant="ghost"
              colorScheme="red"
              onClick={onClear}
            >
              Clear
            </Button>
          )}
        </VStack>
      </Box>
    </Box>
  );
}

export default FileUploadDropZone;
