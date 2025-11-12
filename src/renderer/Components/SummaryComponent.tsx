import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  HStack,
  useToast,
  Spinner,
  Select,
  Switch,
  IconButton,
  Checkbox,
  Divider,
} from '@chakra-ui/react';
import { FaFolderOpen, FaRegFilePdf, FaTimes } from 'react-icons/fa';
import ConfigurationSidebar from './ConfigurationSideBar';
import { supabase } from '../Utils/supabaseClient';
import Navbar from './Navbar';
import { AiOutlineClose } from 'react-icons/ai';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchConfigurations();
  }, []);

  const openFileDialog = () => {
    window.electron.selectFiles().then((selectedFiles) => {
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
    });
  };

  const openDirectoryDialog = () => {
    window.electron.selectDirectory().then((selectedDirectory) => {
      if (selectedDirectory) {
        const directoryPath = selectedDirectory[0];
        setDirectory(directoryPath);
        localStorage.setItem('directory', directoryPath);
      }
    });
  };

  const removeClientFile = (index: number) => {
    const updatedFiles = clientFiles.filter((_, i) => i !== index);
    setClientFiles(updatedFiles);
  };

  const runPythonScript = () => {
    console.log(clientFiles);
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
      console.log('Error running Python script:', result.error);
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
    <Box
      width="100vw"
      height="100vh"
      overflowY="auto"
      position="relative"
      fontFamily="Inter"
    >
      <Navbar />
      <Box
        width="100%"
        height="calc(100vh - 125px)"
        textAlign="center"
        overflowY="auto"
        display="flex"
      >
        <Box width="100%" mr={4}>
          <HStack width="100%" display="flex" alignItems="flex-start">
            <VStack spacing={4} width="60%">
              <Box display="flex" width="100%" alignItems="center" p="20px">
                <Text fontSize="18px" fontWeight="bold" mr="10px">
                  Save Directory:
                </Text>
                <Box
                  display="flex"
                  alignItems="center"
                  border="3px solid #cf3350"
                  borderRadius="md"
                  cursor="pointer"
                  onClick={openDirectoryDialog}
                  flex="1"
                  _hover={{ background: '#f1f1f1' }}
                >
                  <FaFolderOpen
                    size={24}
                    color="#cf3350"
                    style={{ marginRight: '10px', marginLeft: '10px' }}
                  />
                  <Input
                    placeholder="Select the directory you would like to save the files in"
                    value={directory || ''}
                    isReadOnly
                    flex="1"
                    border="none"
                    cursor="pointer"
                  />
                </Box>
              </Box>
              <Text fontSize="xl" fontWeight="bold">
                File input
              </Text>
              <Button
                border="2px dashed #cf3350"
                borderRadius="md"
                p={5}
                cursor="pointer"
                onClick={openFileDialog}
                width="80%"
                height="150px"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                _hover={{ background: '#f1f1f1' }}
              >
                <FaRegFilePdf
                  size="25px"
                  color="#cf3350"
                  style={{ marginBottom: '10px' }}
                />
                <Text color="#cf3350" fontWeight="bold">
                  Click to select your PDF files
                </Text>
              </Button>

              <Button
                bg="#cf3350"
                color="white"
                onClick={runPythonScript}
                _hover={{ opacity: '0.5' }}
                mt={4}
              >
                Generate Documents
              </Button>

              <Box mt={4} maxWidth="60%">
                {isLoading && (
                  <Spinner
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    size="lg"
                  />
                )}
              </Box>
            </VStack>
            <VStack
              spacing={4}
              display="flex"
              width="40%"
              height="100vh"
              borderLeft="solid 2px #cf3350"
            >
              <Text fontSize="xl" fontWeight="bold" textAlign="left" mt="15px">
                Client Files
              </Text>
              <Divider w="90%" borderColor="#cf3350" />
              {clientFiles && clientFiles.length > 0 ? (
                clientFiles.map((file, index) => (
                  <Box
                    key={index}
                    borderWidth="1px"
                    borderRadius="md"
                    bg="#f1f1f1"
                    p={4}
                    width={'95%'}
                    boxShadow="0 8px 16px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)"
                    border="1px solid #cf3350"
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
                          padding={6}
                          backgroundColor={
                            file.title === title.value ? '#cf3350' : '#e0e0e0'
                          }
                          color={
                            file.title === title.value ? 'white' : '#414141'
                          }
                          fontWeight="bold"
                          fontSize="14px"
                          borderRadius="5px"
                          _hover={{
                            backgroundColor:
                              file.title === title.value
                                ? '#cf3350'
                                : '#d3d3d3',
                            color:
                              file.title === title.value ? 'white' : '#414141',
                          }}
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
                          mr={'5px'}
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
                        {file.label || 'Untitled File'}
                      </Text>

                      <HStack spacing={2}>
                        <Button
                          onClick={() => {
                            const updatedFiles = [...clientFiles];
                            updatedFiles[index].isNewcomer =
                              !updatedFiles[index].isNewcomer;
                            setClientFiles(updatedFiles);
                          }}
                          backgroundColor={
                            file.isNewcomer ? '#cf3350' : '#e0e0e0'
                          }
                          color={file.isNewcomer ? 'white' : '#414141'}
                          fontWeight="bold"
                          fontSize="16px"
                          borderRadius="8px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          padding="8px 16px"
                          _hover={{
                            backgroundColor: file.isNewcomer
                              ? '#cf3350'
                              : '#d3d3d3',
                            color: file.isNewcomer ? 'white' : '#414141',
                          }}
                        >
                          <Switch
                            isChecked={file.isNewcomer}
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
                          backgroundColor={
                            file.isMailQC ? '#386498' : '#e0e0e0'
                          }
                          color={file.isMailQC ? 'white' : '#414141'}
                          fontWeight="bold"
                          fontSize="16px"
                          borderRadius="8px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          padding="8px 16px"
                          _hover={{
                            backgroundColor: file.isMailQC
                              ? '#386498'
                              : '#d3d3d3',
                            color: file.isMailQC ? 'white' : '#414141',
                          }}
                        >
                          <Switch
                            isChecked={file.isMailQC}
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
                          value={file.coupleWith}
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
                                clientFile.coupleWith = file.label; // Set the coupleWith label of the selected file
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
                            .map((file, i) => (
                              <option key={i} value={file.label}>
                                {file.label}
                              </option>
                            ))}
                        </Select>{' '}
                        {file.coupleWith !== 'Individual Summary' && (
                          <Switch
                            isChecked={file.isPrimary}
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
                            fontSize={'18px'}
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
                  width="90%"
                  mt="10%"
                  textAlign="center"
                  bg="#f1f1f1"
                  ml="5%"
                  mr="5%"
                  p={4}
                  borderRadius="15px"
                  boxShadow="4px 8px 16px rgba(0, 0, 0, 0.1), 2px 4px 6px rgba(0, 0, 0, 0.05)"
                  border="1px solid #414141"
                >
                  <Text mt="20%" fontSize="18px" fontWeight="bold">
                    No files selected
                  </Text>{' '}
                  <Text mb="20%" fontSize="16px" paddingX={10}>
                    Please select the copies you wish to process by clicking on
                    the box on the left.
                  </Text>
                </Box>
              )}
            </VStack>
          </HStack>
        </Box>
        <Button
          position="absolute"
          right="0px"
          top="40px"
          whiteSpace="nowrap"
          onClick={() => setIsSidebarOpen(true)}
          _hover={{ opacity: '0.6' }}
          bg="#cf3350"
          color="white"
          fontSize="18px"
          padding="25px"
          borderLeftRadius="20px"
        >
          Configuration
        </Button>
        <ConfigurationSidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      </Box>
    </Box>
  );
}

export default SummaryComponent;
