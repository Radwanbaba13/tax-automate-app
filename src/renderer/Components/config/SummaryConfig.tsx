import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { MdDragHandle } from 'react-icons/md';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { api } from '../../Utils/apiClient';
import { validateConfig } from '../../Utils/saveConfiguration';

interface SummaryConfiguration {
  fedAuthSection: { en: string[]; fr: string[] };
  qcAuthSection: { en: string[]; fr: string[] };
  summarySection: { en: string[]; fr: string[] };
}

function SummaryConfig() {
  const [config, setConfig] = useState<SummaryConfiguration>({
    fedAuthSection: { en: [], fr: [] },
    qcAuthSection: { en: [], fr: [] },
    summarySection: { en: [], fr: [] },
  });
  const [isModified, setIsModified] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
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

          setConfig({
            fedAuthSection: parseSection(sectionData.fed_auth_section),
            qcAuthSection: parseSection(sectionData.qc_auth_section),
            summarySection: parseSection(sectionData.summary_section),
          });
        }
      } catch {
        toast({
          title: 'Error fetching data',
          description: 'Could not fetch summary configuration.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchData();
  }, [toast]);

  const handleUpdateText = (
    lang: 'en' | 'fr',
    section: 'fedAuth' | 'qcAuth' | 'summary',
    index: number,
    value: string,
  ) => {
    const updatedConfig = { ...config };

    // Ensure sections exist
    if (section === 'fedAuth') {
      if (!updatedConfig.fedAuthSection) {
        updatedConfig.fedAuthSection = { en: [], fr: [] };
      }
      if (!updatedConfig.fedAuthSection[lang]) {
        updatedConfig.fedAuthSection[lang] = [];
      }
      updatedConfig.fedAuthSection[lang][index] = value;
    } else if (section === 'qcAuth') {
      if (!updatedConfig.qcAuthSection) {
        updatedConfig.qcAuthSection = { en: [], fr: [] };
      }
      if (!updatedConfig.qcAuthSection[lang]) {
        updatedConfig.qcAuthSection[lang] = [];
      }
      updatedConfig.qcAuthSection[lang][index] = value;
    } else if (section === 'summary') {
      if (!updatedConfig.summarySection) {
        updatedConfig.summarySection = { en: [], fr: [] };
      }
      if (!updatedConfig.summarySection[lang]) {
        updatedConfig.summarySection[lang] = [];
      }
      updatedConfig.summarySection[lang][index] = value;
    }

    setConfig(updatedConfig);
    setIsModified(true);
  };

  const handleAddInput = (section: 'fedAuth' | 'qcAuth' | 'summary') => {
    const updatedConfig = { ...config };

    if (section === 'fedAuth') {
      if (!updatedConfig.fedAuthSection) {
        updatedConfig.fedAuthSection = { en: [], fr: [] };
      }
      updatedConfig.fedAuthSection.en.push('');
      updatedConfig.fedAuthSection.fr.push('');
    } else if (section === 'qcAuth') {
      if (!updatedConfig.qcAuthSection) {
        updatedConfig.qcAuthSection = { en: [], fr: [] };
      }
      updatedConfig.qcAuthSection.en.push('');
      updatedConfig.qcAuthSection.fr.push('');
    } else {
      if (!updatedConfig.summarySection) {
        updatedConfig.summarySection = { en: [], fr: [] };
      }
      updatedConfig.summarySection.en.push('');
      updatedConfig.summarySection.fr.push('');
    }

    setConfig(updatedConfig);
    setIsModified(true);
  };

  const handleRemoveInput = (
    section: 'fedAuth' | 'qcAuth' | 'summary',
    index: number,
  ) => {
    const updatedConfig = { ...config };

    if (section === 'fedAuth') {
      if (
        updatedConfig.fedAuthSection?.en &&
        updatedConfig.fedAuthSection?.fr
      ) {
        updatedConfig.fedAuthSection.en.splice(index, 1);
        updatedConfig.fedAuthSection.fr.splice(index, 1);
      }
    } else if (section === 'qcAuth') {
      if (updatedConfig.qcAuthSection?.en && updatedConfig.qcAuthSection?.fr) {
        updatedConfig.qcAuthSection.en.splice(index, 1);
        updatedConfig.qcAuthSection.fr.splice(index, 1);
      }
    } else {
      if (
        updatedConfig.summarySection?.en &&
        updatedConfig.summarySection?.fr
      ) {
        updatedConfig.summarySection.en.splice(index, 1);
        updatedConfig.summarySection.fr.splice(index, 1);
      }
    }

    setConfig(updatedConfig);
    setIsModified(true);
  };

  const handleSave = async () => {
    // Validate the config before saving
    const isValid = validateConfig(config, toast);
    if (!isValid) {
      return;
    }

    try {
      const { error } = await api.configurations.update({
        fed_auth_section: config.fedAuthSection,
        qc_auth_section: config.qcAuthSection,
        summary_section: config.summarySection,
      });

      if (error) throw error;

      setIsModified(false);
      toast({
        title: 'Success!',
        description: 'Changes saved successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Error!',
        description: 'Failed to save changes',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const updatedConfig = { ...config };

    if (source.droppableId === 'fedAuthSection') {
      if (
        updatedConfig.fedAuthSection?.en &&
        updatedConfig.fedAuthSection?.fr
      ) {
        const [removed] = updatedConfig.fedAuthSection.en.splice(
          source.index,
          1,
        );
        updatedConfig.fedAuthSection.en.splice(destination.index, 0, removed);
        const [removedFr] = updatedConfig.fedAuthSection.fr.splice(
          source.index,
          1,
        );
        updatedConfig.fedAuthSection.fr.splice(destination.index, 0, removedFr);
      }
    } else if (source.droppableId === 'qcAuthSection') {
      if (updatedConfig.qcAuthSection?.en && updatedConfig.qcAuthSection?.fr) {
        const [removed] = updatedConfig.qcAuthSection.en.splice(
          source.index,
          1,
        );
        updatedConfig.qcAuthSection.en.splice(destination.index, 0, removed);
        const [removedFr] = updatedConfig.qcAuthSection.fr.splice(
          source.index,
          1,
        );
        updatedConfig.qcAuthSection.fr.splice(destination.index, 0, removedFr);
      }
    } else if (source.droppableId === 'summarySection') {
      if (
        updatedConfig.summarySection?.en &&
        updatedConfig.summarySection?.fr
      ) {
        const [removed] = updatedConfig.summarySection.en.splice(
          source.index,
          1,
        );
        updatedConfig.summarySection.en.splice(destination.index, 0, removed);
        const [removedFr] = updatedConfig.summarySection.fr.splice(
          source.index,
          1,
        );
        updatedConfig.summarySection.fr.splice(destination.index, 0, removedFr);
      }
    }

    setConfig(updatedConfig);
    setIsModified(true);
  };

  return (
    <Box p={4}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Tabs variant="enclosed">
          <TabList>
            <Tab
              borderBottom="#cf3350 2px solid"
              fontWeight="bold"
              fontSize="14px"
              _selected={{
                color: '#cf3350',
                borderColor: '#cf3350',
                borderBottom: '0px',
              }}
            >
              Federal Auth
            </Tab>
            <Tab
              borderBottom="#cf3350 2px solid"
              fontWeight="bold"
              fontSize="14px"
              _selected={{
                color: '#cf3350',
                borderColor: '#cf3350',
                borderBottom: '0px',
              }}
            >
              QC Auth
            </Tab>
            <Tab
              borderBottom="#cf3350 2px solid"
              fontWeight="bold"
              fontSize="14px"
              _selected={{
                color: '#cf3350',
                borderColor: '#cf3350',
                borderBottom: '0px',
              }}
            >
              Summary
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Droppable droppableId="fedAuthSection">
                {(provided) => (
                  <VStack
                    spacing={4}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {(config.fedAuthSection?.en || []).map((_, index) => (
                      <Draggable
                        key={`fedAuth-${index}`}
                        draggableId={`fedAuth-${index}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <HStack
                            spacing={2}
                            width="100%"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            bg={snapshot.isDragging ? '#f0f0f0' : 'transparent'}
                          >
                            {/* Drag handle */}
                            <Box cursor="grab" _hover={{ color: '#cf3350' }}>
                              <MdDragHandle size="25px" />
                            </Box>
                            <Input
                              value={config.fedAuthSection?.en?.[index] || ''}
                              onChange={(e) =>
                                handleUpdateText(
                                  'en',
                                  'fedAuth',
                                  index,
                                  e.target.value,
                                )
                              }
                              placeholder={`EN FedAuth ${index + 1}`}
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
                              width="40%"
                            />
                            <Input
                              value={config.fedAuthSection?.fr?.[index] || ''}
                              onChange={(e) =>
                                handleUpdateText(
                                  'fr',
                                  'fedAuth',
                                  index,
                                  e.target.value,
                                )
                              }
                              placeholder={`FR FedAuth ${index + 1}`}
                              border="none"
                              borderRadius="0px"
                              color="#386498"
                              fontWeight="bold"
                              fontSize="14px"
                              borderBottom="2px solid #386498"
                              _focus={{
                                borderBottom: '3px solid #386498',
                                boxShadow: 'none',
                              }}
                              _hover={{
                                borderBottom: '3px solid #386498',
                              }}
                              _placeholder={{
                                color: '#386498',
                                opacity: '0.6',
                                fontSize: '12px',
                              }}
                              width="40%"
                            />
                            <IconButton
                              aria-label="Delete"
                              icon={<IoClose color="grey" size="25px" />}
                              variant="ghost"
                              borderRadius="25px"
                              onClick={() =>
                                handleRemoveInput('fedAuth', index)
                              }
                            />
                          </HStack>
                        )}
                      </Draggable>
                    ))}
                    <Button
                      aria-label="Add"
                      leftIcon={<FaPlus color="#cf3350" />}
                      variant="ghost"
                      borderRadius="25px"
                      onClick={() => handleAddInput('fedAuth')}
                      ml="15px"
                      fontWeight="bold"
                      color="#cf3350"
                    >
                      Add New Row
                    </Button>
                    {provided.placeholder}
                  </VStack>
                )}
              </Droppable>
            </TabPanel>
            <TabPanel>
              <Droppable droppableId="qcAuthSection">
                {(provided) => (
                  <VStack
                    spacing={4}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {(config.qcAuthSection?.en || []).map((_, index) => (
                      <Draggable
                        key={`qcAuth-${index}`}
                        draggableId={`qcAuth-${index}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <HStack
                            spacing={2}
                            width="100%"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            bg={snapshot.isDragging ? '#f0f0f0' : 'transparent'}
                          >
                            <Box cursor="grab" _hover={{ color: '#cf3350' }}>
                              <MdDragHandle size="25px" />
                            </Box>
                            <Input
                              value={config.qcAuthSection?.en?.[index] || ''}
                              onChange={(e) =>
                                handleUpdateText(
                                  'en',
                                  'qcAuth',
                                  index,
                                  e.target.value,
                                )
                              }
                              placeholder={`EN QCAuth ${index + 1}`}
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
                              width="40%"
                            />
                            <Input
                              value={config.qcAuthSection?.fr?.[index] || ''}
                              onChange={(e) =>
                                handleUpdateText(
                                  'fr',
                                  'qcAuth',
                                  index,
                                  e.target.value,
                                )
                              }
                              placeholder={`FR QCAuth ${index + 1}`}
                              border="none"
                              borderRadius="0px"
                              color="#386498"
                              fontWeight="bold"
                              fontSize="14px"
                              borderBottom="2px solid #386498"
                              _focus={{
                                borderBottom: '3px solid #386498',
                                boxShadow: 'none',
                              }}
                              _hover={{
                                borderBottom: '3px solid #386498',
                              }}
                              _placeholder={{
                                color: '#386498',
                                opacity: '0.6',
                                fontSize: '12px',
                              }}
                              width="40%"
                            />
                            <IconButton
                              aria-label="Delete"
                              icon={<IoClose color="grey" size="25px" />}
                              variant="ghost"
                              borderRadius="25px"
                              onClick={() => handleRemoveInput('qcAuth', index)}
                            />
                          </HStack>
                        )}
                      </Draggable>
                    ))}
                    <Button
                      aria-label="Add"
                      leftIcon={<FaPlus color="#cf3350" />}
                      variant="ghost"
                      borderRadius="25px"
                      onClick={() => handleAddInput('qcAuth')}
                      ml="15px"
                      fontWeight="bold"
                      color="#cf3350"
                    >
                      Add New Row
                    </Button>
                    {provided.placeholder}
                  </VStack>
                )}
              </Droppable>
            </TabPanel>
            <TabPanel>
              <Droppable droppableId="summarySection">
                {(provided) => (
                  <VStack
                    justifyContent="left"
                    display="flex"
                    spacing={4}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {(config.summarySection?.en || []).map(
                      (summary, summaryIndex) => (
                        <Draggable
                          key={`summary-${summaryIndex}`}
                          draggableId={`summary-${summaryIndex}`}
                          index={summaryIndex}
                        >
                          {(provided, snapshot) => (
                            <VStack
                              spacing={2}
                              width="100%"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              bg={
                                snapshot.isDragging ? '#f0f0f0' : 'transparent'
                              }
                            >
                              <HStack spacing={2} width="100%">
                                <Box
                                  cursor="grab"
                                  _hover={{ color: '#cf3350' }}
                                >
                                  <MdDragHandle size="25px" />
                                </Box>
                                <Input
                                  value={
                                    config.summarySection?.en?.[summaryIndex] ||
                                    ''
                                  }
                                  onChange={(e) =>
                                    handleUpdateText(
                                      'en',
                                      'summary',
                                      summaryIndex,
                                      e.target.value,
                                    )
                                  }
                                  placeholder={`EN Summary ${summaryIndex + 1}`}
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
                                  width="40%"
                                />
                                <Input
                                  value={
                                    config.summarySection?.fr?.[summaryIndex] ||
                                    ''
                                  }
                                  onChange={(e) =>
                                    handleUpdateText(
                                      'fr',
                                      'summary',
                                      summaryIndex,
                                      e.target.value,
                                    )
                                  }
                                  placeholder={`FR Summary ${summaryIndex + 1}`}
                                  border="none"
                                  borderRadius="0px"
                                  color="#386498"
                                  fontWeight="bold"
                                  fontSize="14px"
                                  borderBottom="2px solid #386498"
                                  _focus={{
                                    borderBottom: '3px solid #386498',
                                    boxShadow: 'none',
                                  }}
                                  _hover={{
                                    borderBottom: '3px solid #386498',
                                  }}
                                  _placeholder={{
                                    color: '#386498',
                                    opacity: '0.6',
                                    fontSize: '12px',
                                  }}
                                  width="40%"
                                />
                                <IconButton
                                  aria-label="Delete Summary"
                                  icon={<IoClose color="grey" size="25px" />}
                                  variant="ghost"
                                  borderRadius="25px"
                                  onClick={() =>
                                    handleRemoveInput('summary', summaryIndex)
                                  }
                                />
                              </HStack>
                            </VStack>
                          )}
                        </Draggable>
                      ),
                    )}
                    <Button
                      aria-label="Add"
                      leftIcon={<FaPlus color="#cf3350" />}
                      variant="ghost"
                      borderRadius="25px"
                      onClick={() => handleAddInput('summary')}
                      ml="15px"
                      fontWeight="bold"
                      color="#cf3350"
                    >
                      Add New Row
                    </Button>

                    {provided.placeholder}
                  </VStack>
                )}
              </Droppable>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </DragDropContext>
      <Box mt="auto" display="flex" justifyContent="flex-end" p={4}>
        <Button
          bg="#cf3350"
          color="white"
          _hover={{ bg: '#cf3350' }}
          onClick={handleSave}
          isDisabled={!isModified}
        >
          Save Changes
        </Button>
      </Box>
    </Box>
  );
}

export default SummaryConfig;
