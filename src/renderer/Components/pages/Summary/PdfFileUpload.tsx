import React from 'react';
import { VStack, Text, Button, Spinner } from '@chakra-ui/react';
import { FaRegFilePdf } from 'react-icons/fa';
import { Card } from '../../common';

interface PdfFileUploadProps {
  onFileSelect: () => void;
  onGenerate: () => void;
  isLoading: boolean;
}

function PdfFileUpload({
  onFileSelect,
  onGenerate,
  isLoading,
}: PdfFileUploadProps) {
  return (
    <Card width="100%">
      <VStack spacing={4}>
        <Text fontSize="md" fontWeight="600" color="gray.700">
          PDF File Input
        </Text>
        <Button
          border="2px dashed"
          borderColor="brand.500"
          bg="white"
          borderRadius="md"
          p={8}
          cursor="pointer"
          onClick={onFileSelect}
          width="100%"
          height="150px"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          _hover={{ bg: 'gray.50' }}
        >
          <FaRegFilePdf
            size="32px"
            color="#cf3350"
            style={{ marginBottom: '12px' }}
          />
          <Text color="brand.500" fontWeight="600">
            Click to select your PDF files
          </Text>
        </Button>

        <Button
          colorScheme="brand"
          onClick={onGenerate}
          width="100%"
          size="lg"
        >
          Generate Documents
        </Button>

        {isLoading && (
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="brand.500"
            size="lg"
          />
        )}
      </VStack>
    </Card>
  );
}

export default PdfFileUpload;
