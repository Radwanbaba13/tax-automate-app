import React from 'react';
import { VStack, Button } from '@chakra-ui/react';
import { MdCloudUpload } from 'react-icons/md';
import { FileUploadDropZone } from '../../common';
import SectionCard from '../../common/SectionCard';

interface FileUploadPanelProps {
  dtMaxFiles: File[];
  clientSlipsFiles: File[];
  onDtMaxUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClientSlipsUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearDtMax: () => void;
  onClearClientSlips: () => void;
  onCompare: () => void;
  isComparing: boolean;
  isDisabled: boolean;
}

function FileUploadPanel({
  dtMaxFiles,
  clientSlipsFiles,
  onDtMaxUpload,
  onClientSlipsUpload,
  onClearDtMax,
  onClearClientSlips,
  onCompare,
  isComparing,
  isDisabled,
}: FileUploadPanelProps) {
  return (
    <SectionCard
      icon={<MdCloudUpload size={18} />}
      title="Upload Documents"
      contentProps={{ p: 4 }}
    >
      <VStack spacing={4} align="stretch">
        <FileUploadDropZone
          title="DT Max Workspace"
          files={dtMaxFiles}
          onFilesSelected={onDtMaxUpload}
          onClear={onClearDtMax}
          colorScheme="blue"
          hoverBorderColor="blue.500"
          hoverBgColor="blue.50"
        />

        <FileUploadDropZone
          title="Client Tax Slips"
          files={clientSlipsFiles}
          onFilesSelected={onClientSlipsUpload}
          onClear={onClearClientSlips}
          colorScheme="green"
          hoverBorderColor="green.500"
          hoverBgColor="green.50"
        />

        <Button
          colorScheme="purple"
          size="md"
          onClick={onCompare}
          isLoading={isComparing}
          loadingText="Comparing..."
          isDisabled={isDisabled}
          w="100%"
        >
          Compare with AI
        </Button>
      </VStack>
    </SectionCard>
  );
}

export default FileUploadPanel;
