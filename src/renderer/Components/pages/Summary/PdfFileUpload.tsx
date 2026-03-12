import React from 'react';
import { Box, Text, Button, Spinner } from '@chakra-ui/react';
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
      flex={1}
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
      contentProps={{ p: 4, display: 'flex', flexDirection: 'column' }}
    >
      <Button
        border="2px dashed"
        borderColor="gray.300"
        bg="gray.50"
        _dark={{ bg: '#1e1e1e', borderColor: '#464646', _hover: { bg: '#2a2a2a', borderColor: '#cf3350' } }}
        borderRadius="12px"
        p={8}
        cursor="pointer"
        onClick={onFileSelect}
        width="100%"
        flex={1}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        _hover={{ bg: '#fff5f7', borderColor: 'brand.500' }}
        transition="all 0.2s"
      >
        {isLoading ? (
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="brand.500"
            size="xl"
          />
        ) : (
          <>
            <Box
              bg="brand.50"
              _dark={{ bg: 'rgba(207,51,80,0.15)' }}
              p={3}
              borderRadius="full"
              mb={3}
            >
              <FaRegFilePdf size="24px" color="#cf3350" />
            </Box>
            <Text color="gray.700" fontWeight="600" fontSize="sm" _dark={{ color: 'gray.200' }}>
              Click to select your PDF files
            </Text>
            <Text color="gray.400" fontSize="xs" mt={1} _dark={{ color: 'gray.500' }}>
              Supports .pdf files
            </Text>
          </>
        )}
      </Button>
    </SectionCard>
  );
}

export default PdfFileUpload;
