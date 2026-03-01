import React from 'react';
import { VStack, HStack } from '@chakra-ui/react';
import { showToast } from '../../../Utils/toast';
import CustomInstructions from './CustomInstructions';
import FileUploadPanel from './FileUploadPanel';
import ResultsPanel from './ResultsPanel';

// Default user-editable prompt for specific comparison instructions
const DEFAULT_USER_PROMPT = `Compare all fields systematically:

- Income amounts (employment, self-employment, investments, etc.)

- Pay special attention to decimal errors and transposed digits

- Flag ANY discrepancies, no matter how small (including cents)`;

function DataReviewComponent() {
  const [aiPrompt, setAiPrompt] = React.useState(DEFAULT_USER_PROMPT);
  const [dtMaxFiles, setDtMaxFiles] = React.useState<File[]>([]);
  const [clientSlipsFiles, setClientSlipsFiles] = React.useState<File[]>([]);
  const [isComparing, setIsComparing] = React.useState(false);
  const [comparisonResult, setComparisonResult] = React.useState('');
  const [metrics, setMetrics] = React.useState<{
    cost: number;
    timeMinutes: number;
    timeSeconds: number;
  } | null>(null);
  const [debugInfo, setDebugInfo] = React.useState<any>(null);

  // Load saved prompt from localStorage on mount, or use default
  React.useEffect(() => {
    const savedPrompt = localStorage.getItem('dataReviewLastPrompt');
    if (savedPrompt) {
      setAiPrompt(savedPrompt);
    } else {
      // Save default prompt to localStorage on first load
      localStorage.setItem('dataReviewLastPrompt', DEFAULT_USER_PROMPT);
    }
  }, []);

  // Save prompt to localStorage whenever it changes
  const handlePromptChange = (value: string) => {
    setAiPrompt(value);
    localStorage.setItem('dataReviewLastPrompt', value);
  };

  const handleDtMaxUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setDtMaxFiles((prev) => [...prev, ...fileArray]);
      showToast({
        title: 'Files uploaded',
        description: `${fileArray.length} DT Max file(s) added`,
        status: 'success',
      });
    }
  };

  const handleClientSlipsUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { files } = event.target;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setClientSlipsFiles((prev) => [...prev, ...fileArray]);
      showToast({
        title: 'Files uploaded',
        description: `${fileArray.length} Client Slip(s) added`,
        status: 'success',
      });
    }
  };

  const handleCompare = async () => {
    if (dtMaxFiles.length === 0 || clientSlipsFiles.length === 0) {
      showToast({
        title: 'Missing files',
        description:
          'Please upload both DT Max Workspace and Client Slips files',
        status: 'warning',
      });
      return;
    }

    if (!aiPrompt.trim()) {
      showToast({
        title: 'Missing prompt',
        description: 'Please enter an AI prompt for comparison',
        status: 'warning',
      });
      return;
    }

    setIsComparing(true);
    setComparisonResult('');
    setMetrics(null);

    try {
      // Convert File objects to base64 format for IPC
      const convertFilesToBase64 = async (files: File[]): Promise<any[]> => {
        const promises = files.map(async (file) => {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = (reader.result as string).split(',')[1];
              resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          return {
            name: file.name,
            type: file.type,
            base64,
          };
        });

        return Promise.all(promises);
      };

      const dtMaxFilesData = await convertFilesToBase64(dtMaxFiles);
      const clientSlipsFilesData = await convertFilesToBase64(clientSlipsFiles);

      // Call OpenAI via IPC
      const response = await window.electron.compareWithOpenAI(
        dtMaxFilesData,
        clientSlipsFilesData,
        aiPrompt,
      );

      if (!response.success) {
        throw new Error(response.error || 'Unknown error occurred');
      }

      const minutes = Math.floor(response.timeSeconds / 60);
      const seconds = response.timeSeconds % 60;

      setComparisonResult(response.result);

      setMetrics({
        cost: response.cost,
        timeMinutes: minutes,
        timeSeconds: seconds,
      });
      setDebugInfo(response.debug || null);

      showToast({
        title: 'Comparison complete',
        description: `AI has analyzed ${dtMaxFiles.length + clientSlipsFiles.length} files`,
        status: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Comparison failed',
        description: error.message || 'Error comparing files',
        status: 'error',
      });
    } finally {
      setIsComparing(false);
    }
  };

  const handleNewReview = () => {
    setDtMaxFiles([]);
    setClientSlipsFiles([]);
    setComparisonResult('');
    setMetrics(null);
    setDebugInfo(null);
    toast({
      title: 'New Review Started',
      description: 'All files and results have been cleared',
      status: 'success',
      duration: 2000,
    });
  };

  return (
    <HStack
      spacing={4}
      align="stretch"
      w="100%"
      h="calc(100vh - 170px)"
      bg="gray.50"
    >
      {/* Left Panel - Inputs */}
      <VStack
        spacing={4}
        align="stretch"
        w="450px"
        minW="450px"
        h="calc(100vh - 170px)"
      >
        <CustomInstructions
          prompt={aiPrompt}
          onPromptChange={handlePromptChange}
          onNewReview={handleNewReview}
        />

        <FileUploadPanel
          dtMaxFiles={dtMaxFiles}
          clientSlipsFiles={clientSlipsFiles}
          onDtMaxUpload={handleDtMaxUpload}
          onClientSlipsUpload={handleClientSlipsUpload}
          onClearDtMax={() => setDtMaxFiles([])}
          onClearClientSlips={() => setClientSlipsFiles([])}
          onCompare={handleCompare}
          isComparing={isComparing}
          isDisabled={
            dtMaxFiles.length === 0 ||
            clientSlipsFiles.length === 0 ||
            !aiPrompt.trim()
          }
        />
      </VStack>

      {/* Right Panel - Results */}
      <ResultsPanel
        isComparing={isComparing}
        comparisonResult={comparisonResult}
        metrics={metrics}
        debugInfo={debugInfo}
      />
    </HStack>
  );
}

export default DataReviewComponent;
