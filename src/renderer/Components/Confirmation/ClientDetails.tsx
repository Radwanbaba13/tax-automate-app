import React from 'react';
import { Box, FormControl, HStack, IconButton, VStack } from '@chakra-ui/react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import { AiOutlineClose, AiOutlinePlus, AiOutlineMail } from 'react-icons/ai';
import { PiMailboxBold } from 'react-icons/pi';
import { MdDragIndicator } from 'react-icons/md';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface ConfirmationNumbers {
  federal: string;
  quebec?: string;
  t1135: string;
}

interface YearItem {
  year: string;
  confirmationNumbers: ConfirmationNumbers;
}

interface Client {
  title: string;
  name: string;
  years: YearItem[];
}

interface ClientDetailsProps {
  clients: Client[];
  handleClientChange: (
    clientIndex: number,
    field: string,
    yearIndex: number | null,
    yearField: string | null,
    value: string,
  ) => void;
  handleConfirmationNumberChange: (
    clientIndex: number,
    yearIndex: number,
    type: string,
    value: string,
  ) => void;
  selectedProvince: string;
  removeClient: (index: number) => void;
  addYear: (clientIndex: number) => void;
  removeYear: (clientIndex: number, yearIndex: number) => void;
  onDragEnd: (result: any, clientIndex: number) => void;
}

function ClientDetails({
  clients,
  handleClientChange,
  handleConfirmationNumberChange,
  selectedProvince,
  removeClient,
  addYear,
  removeYear,
  onDragEnd,
}: ClientDetailsProps) {
  const handleMailQC = (clientIndex: number, yearIndex: number) => {
    handleConfirmationNumberChange(clientIndex, yearIndex, 'quebec', 'Mail QC');
  };

  const handleSentMailQC = (clientIndex: number, yearIndex: number) => {
    handleConfirmationNumberChange(
      clientIndex,
      yearIndex,
      'quebec',
      'Sent Mail QC',
    );
  };

  return (
    <>
      {/* eslint-disable react/no-array-index-key */}
      {clients.map((client, clientIndex) => (
        <Box
          key={`client-${clientIndex}`}
          bg="white"
          border="1px solid #edf2f7"
          borderRadius="12px"
          boxShadow="0 1px 1px rgba(0,0,0,0.05)"
          p={4}
          mb={3}
        >
          {/* Client Title and Name */}
          <FormControl mb={4}>
            <HStack spacing={4}>
              <FormSelect
                placeholder="Select Title"
                onChange={(e) =>
                  handleClientChange(
                    clientIndex,
                    'title',
                    null,
                    null,
                    e.target.value,
                  )
                }
                value={client.title}
                width="25%"
              >
                <option value="Mr">Mr./M.</option>
                <option value="Mrs">Mrs./Mme</option>
                <option value="Ms">Ms./Mme</option>
              </FormSelect>
              <FormInput
                placeholder="Name"
                value={client.name}
                onChange={(e) =>
                  handleClientChange(
                    clientIndex,
                    'name',
                    null,
                    null,
                    e.target.value,
                  )
                }
                width="75%"
              />
              <IconButton
                aria-label="Remove Client"
                color="#cf3350"
                borderRadius="50px"
                icon={<AiOutlineClose size="20px" />}
                onClick={() => removeClient(clientIndex)}
                colorScheme="red"
                size="md"
                variant="ghost"
                mr="5px"
              />
            </HStack>
          </FormControl>

          {/* Draggable and Sortable Years */}
          <DragDropContext
            onDragEnd={(result) => onDragEnd(result, clientIndex)}
          >
            <Droppable
              droppableId={`droppable-${clientIndex}`}
              isDropDisabled={false}
              isCombineEnabled={false}
              ignoreContainerClipping={false}
            >
              {(droppableProvided) => (
                <VStack
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...droppableProvided.droppableProps}
                  ref={droppableProvided.innerRef}
                  spacing={4}
                  align="start"
                  mb={4}
                >
                  {/* eslint-disable react/no-array-index-key */}
                  {client.years.map((yearItem, yearIndex) => (
                    <Draggable
                      key={`year-${clientIndex}-${yearIndex}`}
                      draggableId={`draggable-${clientIndex}-${yearIndex}`}
                      index={yearIndex}
                    >
                      {(draggableProvided) => (
                        <HStack
                          ref={draggableProvided.innerRef}
                          // eslint-disable-next-line react/jsx-props-no-spreading
                          {...draggableProvided.draggableProps}
                          // eslint-disable-next-line react/jsx-props-no-spreading
                          {...draggableProvided.dragHandleProps}
                          spacing={1}
                          align="start"
                        >
                          {/* Remove Year */}
                          {client.years.length > 1 && (
                            <IconButton
                              aria-label="Remove Year"
                              icon={<AiOutlineClose />}
                              onClick={() => removeYear(clientIndex, yearIndex)}
                              size="md"
                              bg="red.100"
                              color="red.600"
                              borderRadius="50px"
                              _hover={{ bg: 'red.200' }}
                            />
                          )}
                          {/* Drag Handle */}
                          <IconButton
                            aria-label="Drag Year"
                            icon={<MdDragIndicator size="20px" />}
                            colorScheme="grey"
                            variant="ghost"
                            size="md"
                            borderRadius="50px"
                            // eslint-disable-next-line react/jsx-props-no-spreading
                            {...draggableProvided.dragHandleProps}
                          />
                          {/* Year and Confirmation Numbers */}
                          <FormSelect
                            width="150px"
                            placeholder="Year"
                            value={yearItem.year}
                            onChange={(e) =>
                              handleClientChange(
                                clientIndex,
                                'years',
                                yearIndex,
                                'year',
                                e.target.value,
                              )
                            }
                          >
                            {Array.from(
                              { length: 2025 - 2010 },
                              (_, i) => 2025 - i,
                            ).map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </FormSelect>
                          <HStack spacing={2} width="100%">
                            <FormInput
                              width="50%"
                              placeholder="Federal Confirmation Number"
                              value={yearItem.confirmationNumbers.federal || ''}
                              onChange={(e) =>
                                handleConfirmationNumberChange(
                                  clientIndex,
                                  yearIndex,
                                  'federal',
                                  e.target.value,
                                )
                              }
                            />
                            {selectedProvince === 'QC' && (
                              <HStack
                                spacing={1}
                                position="relative"
                                alignItems="flex-end"
                                pb={0}
                                _after={{
                                  content: '""',
                                  position: 'absolute',
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  borderBottom: '2px solid #386498',
                                  pointerEvents: 'none',
                                }}
                              >
                                <FormInput
                                  variant="secondary"
                                  placeholder="Quebec Num..."
                                  value={
                                    yearItem.confirmationNumbers.quebec || ''
                                  }
                                  onChange={(e) =>
                                    handleConfirmationNumberChange(
                                      clientIndex,
                                      yearIndex,
                                      'quebec',
                                      e.target.value,
                                    )
                                  }
                                  borderBottom="0"
                                  _focus={{
                                    borderBottom: '0',
                                    boxShadow: 'none',
                                  }}
                                  _hover={{ borderBottom: '0' }}
                                />
                                <IconButton
                                  aria-label="Mail QC Confirmation"
                                  mb="5px"
                                  icon={<AiOutlineMail size="18px" />}
                                  onClick={() =>
                                    handleMailQC(clientIndex, yearIndex)
                                  }
                                  colorScheme="blue"
                                  size="sm"
                                  variant={
                                    yearItem.confirmationNumbers.quebec ===
                                    'Mail QC'
                                      ? 'solid'
                                      : 'outline'
                                  }
                                  borderRadius="5px"
                                  ml={1}
                                />
                                <IconButton
                                  aria-label="Sent Mail QC Confirmation"
                                  mb="5px"
                                  icon={<PiMailboxBold size="18px" />}
                                  onClick={() =>
                                    handleSentMailQC(clientIndex, yearIndex)
                                  }
                                  colorScheme="green"
                                  size="sm"
                                  variant={
                                    yearItem.confirmationNumbers.quebec ===
                                    'Sent Mail QC'
                                      ? 'solid'
                                      : 'outline'
                                  }
                                  borderRadius="5px"
                                  title="Sent Mail QC (with Post Canada tracking)"
                                />
                              </HStack>
                            )}
                            <FormInput
                              variant="neutral"
                              width="50%"
                              placeholder="T1135 Confirmation Number"
                              value={yearItem.confirmationNumbers.t1135 || ''}
                              onChange={(e) =>
                                handleConfirmationNumberChange(
                                  clientIndex,
                                  yearIndex,
                                  't1135',
                                  e.target.value,
                                )
                              }
                            />
                          </HStack>
                          {/* Add Year (only for the last year) */}
                          {client.years.length - 1 === yearIndex && (
                            <IconButton
                              aria-label="Add Year"
                              icon={<AiOutlinePlus />}
                              onClick={() => addYear(clientIndex)}
                              size="md"
                              variant="ghost"
                              bg="blue.50"
                              border="1px solid #386498"
                              borderRadius="50px"
                              width="40px"
                            />
                          )}
                          {client.years.length - 1 !== yearIndex && (
                            <Box width="40px" />
                          )}
                        </HStack>
                      )}
                    </Draggable>
                  ))}
                  {droppableProvided.placeholder}
                </VStack>
              )}
            </Droppable>
          </DragDropContext>
        </Box>
      ))}
    </>
  );
}

export default ClientDetails;
