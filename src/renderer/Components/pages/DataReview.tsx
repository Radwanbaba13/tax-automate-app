import React from 'react';
import {
  VStack,
  HStack,
  Box,
  Heading,
  Text,
  Button,
  Textarea,
  useToast,
  Spinner,
  Icon,
} from '@chakra-ui/react';
import { FiUpload, FiFileText } from 'react-icons/fi';

// Default user-editable prompt for specific comparison instructions
const DEFAULT_USER_PROMPT = `Compare all fields systematically:
- Income amounts (employment, self-employment, investments, etc.)
- Deduction amounts (RRSP, union dues, childcare, etc.)
- Tax credits (medical, donations, tuition, etc.)
- Pay special attention to decimal errors and transposed digits
- Flag ANY discrepancies, no matter how small (including cents)`;

function DataReviewComponent() {
  const toast = useToast();
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
      toast({
        title: 'Files uploaded',
        description: `${fileArray.length} DT Max file(s) added`,
        status: 'success',
        duration: 3000,
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
      toast({
        title: 'Files uploaded',
        description: `${fileArray.length} Client Slip(s) added`,
        status: 'success',
        duration: 3000,
      });
    }
  };

  const handleCompare = async () => {
    if (dtMaxFiles.length === 0 || clientSlipsFiles.length === 0) {
      toast({
        title: 'Missing files',
        description:
          'Please upload both DT Max Workspace and Client Slips files',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (!aiPrompt.trim()) {
      toast({
        title: 'Missing prompt',
        description: 'Please enter an AI prompt for comparison',
        status: 'warning',
        duration: 3000,
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

      toast({
        title: 'Comparison complete',
        description: `AI has analyzed ${dtMaxFiles.length + clientSlipsFiles.length} files`,
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Comparison failed',
        description: error.message || 'Error comparing files',
        status: 'error',
        duration: 5000,
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
      status: 'info',
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
        {/* AI Prompt Section */}
        <Box
          bg="white"
          borderRadius="lg"
          boxShadow="sm"
          border="1px solid"
          borderColor="gray.200"
          p={4}
        >
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between" align="center">
              <Heading size="sm" color="gray.800">
                Custom Instructions
              </Heading>
              <Button
                size="xs"
                variant="ghost"
                colorScheme="purple"
                onClick={handleNewReview}
              >
                New Review
              </Button>
            </HStack>
            <Text fontSize="xs" color="gray.500">
              Add specific areas to focus on or additional comparison rules.
              Base security rules are automatically enforced (no personal info
              in output, errors-only reporting).
            </Text>
            <Textarea
              value={aiPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              rows={5}
              resize="vertical"
              fontSize="sm"
              placeholder="E.g., Pay special attention to Box 14, Check for common transposition errors in amounts..."
            />
          </VStack>
        </Box>

        {/* File Upload Sections */}
        <Box
          bg="white"
          borderRadius="lg"
          boxShadow="sm"
          border="1px solid"
          borderColor="gray.200"
          p={4}
        >
          <VStack spacing={4} align="stretch">
            {/* DT Max Workspace */}
            <Box>
              <Heading size="sm" color="gray.800" mb={2}>
                DT Max Workspace
              </Heading>
              <Box
                border="2px dashed"
                borderColor="gray.300"
                borderRadius="md"
                p={4}
                transition="all 0.2s"
                _hover={{ borderColor: 'blue.500', bg: 'blue.50' }}
              >
                <VStack spacing={2}>
                  <Icon as={FiFileText} boxSize={8} color="gray.400" />
                  {dtMaxFiles.length > 0 ? (
                    <Text color="green.600" fontWeight="600" fontSize="sm">
                      {dtMaxFiles.length} file{dtMaxFiles.length > 1 ? 's' : ''}{' '}
                      uploaded
                    </Text>
                  ) : (
                    <Text color="gray.500" fontSize="xs">
                      Upload PDF or Images (multiple)
                    </Text>
                  )}
                  <Button
                    leftIcon={<Icon as={FiUpload} />}
                    size="sm"
                    colorScheme="blue"
                    as="label"
                    cursor="pointer"
                  >
                    Choose Files
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      hidden
                      onChange={handleDtMaxUpload}
                    />
                  </Button>
                  {dtMaxFiles.length > 0 && (
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => setDtMaxFiles([])}
                    >
                      Clear
                    </Button>
                  )}
                </VStack>
              </Box>
            </Box>

            {/* Client Slips */}
            <Box>
              <Heading size="sm" color="gray.800" mb={2}>
                Client Tax Slips
              </Heading>
              <Box
                border="2px dashed"
                borderColor="gray.300"
                borderRadius="md"
                p={4}
                transition="all 0.2s"
                _hover={{ borderColor: 'green.500', bg: 'green.50' }}
              >
                <VStack spacing={2}>
                  <Icon as={FiFileText} boxSize={8} color="gray.400" />
                  {clientSlipsFiles.length > 0 ? (
                    <Text color="green.600" fontWeight="600" fontSize="sm">
                      {clientSlipsFiles.length} file
                      {clientSlipsFiles.length > 1 ? 's' : ''} uploaded
                    </Text>
                  ) : (
                    <Text color="gray.500" fontSize="xs">
                      Upload PDF or Images (multiple)
                    </Text>
                  )}
                  <Button
                    leftIcon={<Icon as={FiUpload} />}
                    size="sm"
                    colorScheme="green"
                    as="label"
                    cursor="pointer"
                  >
                    Choose Files
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      hidden
                      onChange={handleClientSlipsUpload}
                    />
                  </Button>
                  {clientSlipsFiles.length > 0 && (
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => setClientSlipsFiles([])}
                    >
                      Clear
                    </Button>
                  )}
                </VStack>
              </Box>
            </Box>

            {/* Compare Button */}
            <Button
              colorScheme="purple"
              size="md"
              onClick={handleCompare}
              isLoading={isComparing}
              loadingText="Comparing..."
              isDisabled={
                dtMaxFiles.length === 0 ||
                clientSlipsFiles.length === 0 ||
                !aiPrompt.trim()
              }
              w="100%"
            >
              Compare with AI
            </Button>
          </VStack>
        </Box>
      </VStack>

      {/* Right Panel - Results */}
      <Box
        flex="1"
        bg="white"
        borderRadius="lg"
        boxShadow="sm"
        border="1px solid"
        borderColor="gray.200"
        p={6}
        overflow="hidden"
      >
        <VStack spacing={4} align="stretch" h="100%">
          <HStack justify="space-between" align="center">
            <Heading size="md" color="gray.800">
              Comparison Results
            </Heading>
            {metrics && !isComparing && (
              <HStack spacing={4} fontSize="sm" color="gray.600">
                <HStack spacing={1}>
                  <Text fontWeight="600">Cost of Comparison:</Text>
                  <Text color="green.600" fontWeight="700">
                    ${metrics.cost.toFixed(4)}
                  </Text>
                </HStack>
                <HStack spacing={1}>
                  <Text fontWeight="600">Time:</Text>
                  <Text color="blue.600" fontWeight="700">
                    {metrics.timeMinutes > 0 && `${metrics.timeMinutes}m `}
                    {metrics.timeSeconds}s
                  </Text>
                </HStack>
              </HStack>
            )}
          </HStack>

          {isComparing && (
            <VStack spacing={4} flex="1" justify="center">
              <Spinner size="xl" color="purple.500" thickness="4px" />
              <Text color="gray.600">AI is analyzing the files...</Text>
            </VStack>
          )}
          {!isComparing && comparisonResult && (
            <>
              <Box
                flex="1"
                bg="gray.50"
                p={4}
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
                overflow="auto"
              >
                <Text whiteSpace="pre-wrap" fontFamily="monospace" fontSize="sm">
                  {comparisonResult}
                </Text>
              </Box>
              {debugInfo && (
                <Box
                  bg="gray.800"
                  p={4}
                  borderRadius="md"
                  border="2px solid"
                  borderColor="gray.600"
                >
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between" align="center">
                      <Text color="gray.300" fontSize="sm" fontWeight="bold">
                        DEBUG INFO
                      </Text>
                      <HStack spacing={1}>
                        <Text color="gray.400" fontSize="lg" fontWeight="bold">
                          COST:
                        </Text>
                        <Text
                          color="green.300"
                          fontSize="2xl"
                          fontWeight="black"
                          fontFamily="monospace"
                        >
                          ${metrics?.cost.toFixed(4)}
                        </Text>
                      </HStack>
                    </HStack>
                    <Box h="1px" bg="gray.700" />
                    <HStack spacing={4} wrap="wrap">
                      <Text
                        color="green.300"
                        fontSize="xs"
                        fontFamily="monospace"
                      >
                        Model: {debugInfo.model}
                      </Text>
                      <Text
                        color="blue.300"
                        fontSize="xs"
                        fontFamily="monospace"
                      >
                        DT Max: {debugInfo.dtMaxImagesCount} imgs
                      </Text>
                      <Text
                        color="blue.300"
                        fontSize="xs"
                        fontFamily="monospace"
                      >
                        Client Slips: {debugInfo.clientSlipsImagesCount} imgs
                      </Text>
                    </HStack>
                    <HStack spacing={4} wrap="wrap">
                      <Text
                        color="yellow.300"
                        fontSize="xs"
                        fontFamily="monospace"
                      >
                        Content Items: {debugInfo.totalContentItems}
                      </Text>
                      <Text
                        color="purple.300"
                        fontSize="xs"
                        fontFamily="monospace"
                      >
                        Tokens: {debugInfo.inputTokens} in /{' '}
                        {debugInfo.outputTokens} out
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              )}
            </>
          )}
          {!isComparing && !comparisonResult && (
            <VStack spacing={3} flex="1" justify="center" color="gray.400">
              <Icon as={FiFileText} boxSize={16} />
              <Text fontSize="lg" fontWeight="500">
                No results yet
              </Text>
              <Text fontSize="sm" textAlign="center" maxW="400px">
                Upload DT Max Workspace and Client Tax Slips, then click
                &quot;Compare with AI&quot; to see the results here.
              </Text>
            </VStack>
          )}
        </VStack>
      </Box>
    </HStack>
  );
}

export default DataReviewComponent;
