import React from 'react';
import { VStack, Text, Button, Spinner } from '@chakra-ui/react';
import { FaRegFilePdf } from 'react-icons/fa';
import { MdCheckCircle } from 'react-icons/md';
import SectionCard from '../../common/SectionCard';

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
    <SectionCard
      width="100%"
      icon={<FaRegFilePdf size={18} />}
      title="PDF Files"
      actions={
        <Button
          leftIcon={<MdCheckCircle />}
          colorScheme="red"
          size="sm"
          onClick={onGenerate}
          isLoading={isLoading}
          loadingText="Generating..."
          borderRadius="8px"
        >
          Generate
        </Button>
      }
      contentProps={{ p: 4 }}
    >
      <VStack spacing={4}>
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
    </SectionCard>
  );
}

export default PdfFileUpload;
