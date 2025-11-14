import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Divider,
  HStack,
  IconButton,
  Input,
  Select,
  Spinner,
  Switch,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { FaFolderOpen, FaRegFilePdf } from 'react-icons/fa';
import { AiOutlineClose } from 'react-icons/ai';
import { supabase } from '../../Utils/supabaseClient';

interface ClientFile {
  label: string;
  title: string;
  coupleWith: string;
  isNewcomer: boolean;
  isPrimary: boolean;
  isMailQC: boolean;
  directory: string;
}

interface SummaryConfiguration {
  fedAuthSection: { en: string[]; fr: string[] };
  qcAuthSection: { en: string[]; fr: string[] };
  summarySection: { en: string[]; fr: string[] };
}

function SummaryComponent() {
  const [clientFiles, setClientFiles] = useState<ClientFile[]>([]);
  const [directory, setDirectory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [configuration, setConfiguration] = useState<SummaryConfiguration>();
  const toast = useToast();

  useEffect(() => {
    const fetchConfigurations = async () => {
      try {
        const storedDirectory = localStorage.getItem('directory');
        setDirectory(storedDirectory);

        const { data: sectionData } = await supabase
          .from('configurations')
          .select('fed_auth_section, qc_auth_section, summary_section')
          .single();

        if (sectionData) {
          setConfiguration({
            fedAuthSection: sectionData.fed_auth_section || { en: [], fr: [] },
            qcAuthSection: sectionData.qc_auth_section || { en: [], fr: [] },
            summarySection: sectionData.summary_section || { en: [], fr: [] },
          });
        }
      } catch {
        toast({
          title: 'Error fetching configurations',
          description: 'Could not fetch summary configurations.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchConfigurations();
  }, [toast]);

  const openFileDialog = () => {
    window.electron
      .selectFiles()
      .then((selectedFiles) => {
        if (selectedFiles && selectedFiles.length > 0) {
          const newClientFiles = selectedFiles.map((filePath: string) => {
            const fileName = filePath.split('\\').pop();
            const titleWithoutExt = fileName.replace('.pdf', '');
            const parts = titleWithoutExt.split(' - ');

            const title =
              parts.length > 1 ? parts.pop()?.trim() || '' : titleWithoutExt;

            return {
              label: title,
              title: 'Mr',
              coupleWith: 'Individual Summary',
              isNewcomer: false,
              isPrimary: false,
              isMailQC: false,
              directory: filePath,
            };
          });
          setClientFiles(newClientFiles);
        }
        return undefined;
      })
      .catch(() => {
        // Handle file selection errors silently
      });
  };

  const openDirectoryDialog = () => {
    window.electron
      .selectDirectory()
      .then((selectedDirectory) => {
        if (selectedDirectory) {
          const directoryPath = selectedDirectory[0];
          setDirectory(directoryPath);
          localStorage.setItem('directory', directoryPath);
        }
        return undefined;
      })
      .catch(() => {
        // Handle directory selection errors silently
      });
  };

  const removeClientFile = (index: number) => {
    const updatedFiles = clientFiles.filter((_, i) => i !== index);
    setClientFiles(updatedFiles);
  };

  const runPythonScript = () => {
    if (!directory) {
      toast({
        title: 'No Directory Selected',
        description: 'Please select a directory for future saved files.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!configuration) {
      toast({
        title: 'No Configuration Provided',
        description:
          'Please provide a valid configuration for processing the files.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (clientFiles.length === 0) {
      toast({
        title: 'No Files Selected',
        description: 'Please select at least one file to process.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    const clientsJson = JSON.stringify(clientFiles);
    const configurationJson = JSON.stringify(configuration);

    // Call the Python script via Electron
    window.electron.runPythonScript('createSummaryDocuments', [
      clientsJson,
      directory,
      configurationJson,
    ]);
  };

  // Set up a listener to handle the result of the script
  window.electron.onPythonResult((result) => {
    setIsLoading(false);

    if (!result.success) {
      toast({
        title: 'Error',
        description: result.error || 'An unknown error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  });

  return (
    <VStack spacing={6} align="stretch" w="100%">
      <HStack w="100%" display="flex" alignItems="flex-start" spacing={6}>
        <VStack spacing={6} flex={1}>
          <Box
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
            border="1px solid"
            borderColor="gray.200"
            p={6}
            width="100%"
          >
            <VStack spacing={2} align="stretch">
              <Text fontSize="md" fontWeight="600" color="gray.700">
                Save Directory
              </Text>
              <HStack
                border="2px solid"
                borderColor="brand.500"
                borderRadius="md"
                cursor="pointer"
                onClick={openDirectoryDialog}
                fontSize="14px"
                padding={4}
                height="45px"
                _hover={{ bg: 'gray.50' }}
              >
                <FaFolderOpen size={18} color="#cf3350" />
                <Input
                  placeholder="Select save directory"
                  value={directory || ''}
                  isReadOnly
                  border="none"
                  cursor="pointer"
                  _focus={{ boxShadow: 'none' }}
                />
              </HStack>
            </VStack>
          </Box>
          <Box
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
            border="1px solid"
            borderColor="gray.200"
            p={6}
            width="100%"
          >
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
                onClick={openFileDialog}
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
                onClick={runPythonScript}
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
          </Box>
        </VStack>
        <Box
          bg="white"
          borderRadius="lg"
          boxShadow="sm"
          border="1px solid"
          borderColor="gray.200"
          p={6}
          flex={1}
          minH="500px"
        >
          <VStack spacing={4} align="stretch">
            <Text fontSize="md" fontWeight="600" color="gray.700">
              Client Files
            </Text>
            <Divider borderColor="gray.300" />
            {clientFiles && clientFiles.length > 0 ? (
              clientFiles.map((fileItem, index) => (
                <Box
                  key={index}
                  borderWidth="1px"
                  borderRadius="md"
                  bg="gray.50"
                  p={4}
                  boxShadow="sm"
                  borderColor="brand.200"
                >
                  <HStack spacing={1}>
                    {[
                      { display: 'Mr./M.', value: 'Mr' },
                      { display: 'Mrs./Mme', value: 'Mrs' },
                      { display: 'Ms./Mme', value: 'Ms' },
                    ].map((title) => (
                      <Button
                        key={title.value}
                        onClick={() => {
                          const updatedFiles = [...clientFiles];
                          updatedFiles[index].title = title.value; // Assign the value ('Mr', 'Mrs', or 'Ms')
                          setClientFiles(updatedFiles);
                        }}
                        size="sm"
                        colorScheme={
                          fileItem.title === title.value ? 'brand' : 'gray'
                        }
                        variant={
                          fileItem.title === title.value ? 'solid' : 'outline'
                        }
                      >
                        {title.display}
                      </Button>
                    ))}
                    <Box
                      display="flex"
                      width="100%"
                      justifyContent="right"
                      alignItems="center"
                    >
                      <IconButton
                        aria-label="Remove Client"
                        borderRadius="50px"
                        icon={<AiOutlineClose size="20px" />}
                        onClick={() => removeClientFile(index)}
                        colorScheme="red"
                        size="md"
                        variant="ghost"
                        mr="5px"
                      />
                    </Box>
                  </HStack>

                  <Divider mt={2} mb={2} />

                  <HStack
                    spacing={4}
                    mt={5}
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Text fontWeight="bold">
                      {fileItem.label || 'Untitled File'}
                    </Text>

                    <HStack spacing={2}>
                      <Button
                        onClick={() => {
                          const updatedFiles = [...clientFiles];
                          updatedFiles[index].isNewcomer =
                            !updatedFiles[index].isNewcomer;
                          setClientFiles(updatedFiles);
                        }}
                        size="sm"
                        colorScheme={fileItem.isNewcomer ? 'brand' : 'gray'}
                        variant={fileItem.isNewcomer ? 'solid' : 'outline'}
                      >
                        <Switch
                          isChecked={fileItem.isNewcomer}
                          onChange={() => {
                            const updatedFiles = [...clientFiles];
                            updatedFiles[index].isNewcomer =
                              !updatedFiles[index].isNewcomer;
                            setClientFiles(updatedFiles);
                          }}
                          colorScheme="red"
                          size="md"
                          marginRight="8px"
                        />
                        Newcomer
                      </Button>

                      <Button
                        onClick={() => {
                          const updatedFiles = [...clientFiles];
                          updatedFiles[index].isMailQC =
                            !updatedFiles[index].isMailQC;
                          setClientFiles(updatedFiles);
                        }}
                        size="sm"
                        colorScheme={fileItem.isMailQC ? 'blue' : 'gray'}
                        variant={fileItem.isMailQC ? 'solid' : 'outline'}
                      >
                        <Switch
                          isChecked={fileItem.isMailQC}
                          onChange={() => {
                            const updatedFiles = [...clientFiles];
                            updatedFiles[index].isMailQC =
                              !updatedFiles[index].isMailQC;
                            setClientFiles(updatedFiles);
                          }}
                          colorScheme="blue"
                          size="md"
                          marginRight="8px"
                        />
                        Mail QC
                      </Button>
                    </HStack>
                  </HStack>

                  {clientFiles.length >= 2 && (
                    <HStack
                      spacing={4}
                      mt={5}
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Select
                        placeholder="Individual Summary"
                        value={fileItem.coupleWith}
                        border="none"
                        borderRadius="0px"
                        color="#cf3350"
                        fontWeight="bold"
                        fontSize="14px"
                        borderBottom="2px solid #cf3350"
                        _focus={{
                          borderBottom: '3px solid #cf3350',
                          boxShadow: 'none',
                        }}
                        _hover={{
                          borderBottom: '3px solid #cf3350',
                        }}
                        _placeholder={{
                          color: '#cf3350',
                          opacity: '0.6',
                          fontSize: '12px',
                        }}
                        onChange={(e) => {
                          const updatedFiles = [...clientFiles];
                          const selectedValue = e.target.value;

                          // Update coupleWith for the current file
                          updatedFiles[index].coupleWith = selectedValue;

                          // Reset the coupleWith of the other files
                          updatedFiles.forEach((clientFile, i) => {
                            if (
                              i !== index &&
                              clientFile.label === selectedValue
                            ) {
                              clientFile.coupleWith = fileItem.label; // Set the coupleWith label of the selected file
                            } else if (i !== index) {
                              clientFile.coupleWith = 'Individual Summary'; // Reset others
                            }
                          });

                          // Ensure only one file can be primary
                          updatedFiles.forEach((clientFile, i) => {
                            clientFile.isPrimary =
                              i === index &&
                              selectedValue !== 'Individual Summary';
                          });

                          setClientFiles(updatedFiles);
                        }}
                        width="60%"
                      >
                        {clientFiles
                          .filter((_, i) => i !== index)
                          .map((mappedFile, i) => (
                            <option key={i} value={mappedFile.label}>
                              {mappedFile.label}
                            </option>
                          ))}
                      </Select>{' '}
                      {fileItem.coupleWith !== 'Individual Summary' && (
                        <Switch
                          isChecked={fileItem.isPrimary}
                          onChange={() => {
                            const updatedFiles = [...clientFiles];
                            const isChecked = !updatedFiles[index].isPrimary;

                            // Allow only one file to be primary
                            updatedFiles.forEach((clientFile, i) => {
                              clientFile.isPrimary =
                                i === index ? isChecked : false;
                            });

                            setClientFiles(updatedFiles);
                          }}
                          colorScheme="green"
                          fontSize="18px"
                        >
                          Primary
                        </Switch>
                      )}
                    </HStack>
                  )}
                </Box>
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
                  Please select PDF files to process by clicking the upload
                  button
                </Text>
              </Box>
            )}
          </VStack>
        </Box>
      </HStack>
    </VStack>
  );
}

export default SummaryComponent;
