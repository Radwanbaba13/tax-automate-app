import React from 'react';
import {
  Box,
  FormControl,
  HStack,
  IconButton,
  Input,
  Select,
  VStack,
} from '@chakra-ui/react';
import { AiOutlineClose, AiOutlinePlus, AiOutlineMail } from 'react-icons/ai';
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

  return (
    <>
      {/* eslint-disable react/no-array-index-key */}
      {clients.map((client, clientIndex) => (
        <Box
          key={`client-${clientIndex}-${client.name}`}
          bg="rgb(47,45,45,0.05)"
          border="1px solid #cf3350"
          borderRadius="md"
          p={4}
          mb={4}
        >
          {/* Client Title and Name */}
          <FormControl mb={4}>
            <HStack spacing={4}>
              <Select
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
                width="25%"
              >
                <option value="Mr">Mr./M.</option>
                <option value="Mrs">Mrs./Mme</option>
                <option value="Ms">Ms./Mme</option>
              </Select>
              <Input
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
                      key={`year-${client.name}-${yearIndex}-${yearItem.year}`}
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
                              colorScheme="red"
                              size="md"
                              variant="ghost"
                              borderRadius="50px"
                            />
                          )}
                          {/* Drag Handle */}
                          <IconButton
                            aria-label="Drag Year"
                            icon={<MdDragIndicator size="20px" />}
                            colorScheme="grey"
                            variant="ghost"
                            size="sm"
                            borderRadius="50px"
                            // eslint-disable-next-line react/jsx-props-no-spreading
                            {...draggableProvided.dragHandleProps}
                          />
                          {/* Year and Confirmation Numbers */}
                          <Select
                            width="150px"
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
                              { length: 2024 - 2010 },
                              (_, i) => 2024 - i,
                            ).map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </Select>
                          <HStack spacing={2} width="100%">
                            <Input
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
                            />
                            {selectedProvince === 'QC' && (
                              <HStack spacing={2}>
                                <Input
                                  placeholder="Quebec Confirmation Number"
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
                                />
                                <IconButton
                                  aria-label="Mail QC Confirmation"
                                  icon={<AiOutlineMail />}
                                  onClick={() =>
                                    handleMailQC(clientIndex, yearIndex)
                                  }
                                  colorScheme="blue"
                                  size="md"
                                  variant="ghost"
                                  borderRadius="50px"
                                />
                              </HStack>
                            )}
                            <Input
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
                              border="none"
                              borderRadius="0px"
                              color="#757575"
                              fontWeight="bold"
                              fontSize="14px"
                              borderBottom="2px solid#757575"
                              _focus={{
                                borderBottom: '3px solid #757575',
                                boxShadow: 'none',
                              }}
                              _hover={{
                                borderBottom: '3px solid #757575',
                              }}
                              _placeholder={{
                                color: '#757575',
                                opacity: '0.6',
                                fontSize: '12px',
                              }}
                            />
                          </HStack>
                          {/* Add Year (only for the last year) */}
                          {client.years.length - 1 === yearIndex && (
                            <IconButton
                              aria-label="Add Year"
                              icon={<AiOutlinePlus />}
                              onClick={() => addYear(clientIndex)}
                              colorScheme="red"
                              size="md"
                              variant="ghost"
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
