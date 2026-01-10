import React, { useState, useEffect } from 'react';
import { VStack, HStack, useToast } from '@chakra-ui/react';
import { api } from '../../../Utils/apiClient';
import DirectorySelector from './DirectorySelector';
import PdfFileUpload from './PdfFileUpload';
import ClientFilesList from './ClientFilesList';

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

        const { data: sectionData } = await api.configurations.get();

        if (sectionData) {
          // Helper function to parse JSON strings or return default structure
          const parseSection = (section: any) => {
            if (!section) return { en: [], fr: [] };
            if (typeof section === 'string') {
              try {
                const parsed = JSON.parse(section);
                return {
                  en: Array.isArray(parsed?.en) ? parsed.en : [],
                  fr: Array.isArray(parsed?.fr) ? parsed.fr : [],
                };
              } catch {
                return { en: [], fr: [] };
              }
            }
            if (typeof section === 'object') {
              return {
                en: Array.isArray(section?.en) ? section.en : [],
                fr: Array.isArray(section?.fr) ? section.fr : [],
              };
            }
            return { en: [], fr: [] };
          };

          setConfiguration({
            fedAuthSection: parseSection(sectionData.fed_auth_section),
            qcAuthSection: parseSection(sectionData.qc_auth_section),
            summarySection: parseSection(sectionData.summary_section),
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

  const handleUpdateFile = (index: number, updates: Partial<ClientFile>) => {
    const updatedFiles = [...clientFiles];
    updatedFiles[index] = { ...updatedFiles[index], ...updates };

    // Handle isPrimary - only one can be primary
    if (updates.isPrimary !== undefined) {
      updatedFiles.forEach((file, i) => {
        if (i !== index) {
          file.isPrimary = false;
        }
      });
    }

    setClientFiles(updatedFiles);
  };

  const handleCoupleWithChange = (index: number, selectedValue: string) => {
    const updatedFiles = [...clientFiles];

    // Update coupleWith for the current file
    updatedFiles[index].coupleWith = selectedValue;

    // Reset the coupleWith of the other files
    updatedFiles.forEach((clientFile, i) => {
      if (i !== index && clientFile.label === selectedValue) {
        clientFile.coupleWith = clientFiles[index].label;
      } else if (i !== index) {
        clientFile.coupleWith = 'Individual Summary';
      }
    });

    // Ensure only one file can be primary
    updatedFiles.forEach((clientFile, i) => {
      clientFile.isPrimary =
        i === index && selectedValue !== 'Individual Summary';
    });

    setClientFiles(updatedFiles);
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
          <DirectorySelector
            directory={directory}
            onSelectDirectory={openDirectoryDialog}
          />
          <PdfFileUpload
            onFileSelect={openFileDialog}
            onGenerate={runPythonScript}
            isLoading={isLoading}
          />
        </VStack>
        <ClientFilesList
          clientFiles={clientFiles}
          onUpdateFile={handleUpdateFile}
          onRemoveFile={removeClientFile}
          onCoupleWithChange={handleCoupleWithChange}
        />
      </HStack>
    </VStack>
  );
}

export default SummaryComponent;
