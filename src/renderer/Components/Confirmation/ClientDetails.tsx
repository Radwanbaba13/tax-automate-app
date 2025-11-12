import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Select,
  Input,
  FormControl,
  IconButton,
} from '@chakra-ui/react';
import { MdDragIndicator } from 'react-icons/md';
import { AiOutlineClose, AiOutlinePlus, AiOutlineMail } from 'react-icons/ai';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function ClientDetails({
  clients,
  handleClientChange,
  handleConfirmationNumberChange,
  selectedProvince,
  removeClient,
  addYear,
  removeYear,
  onDragEnd,
}) {
  const handleMailQC = (clientIndex, yearIndex) => {
    handleConfirmationNumberChange(clientIndex, yearIndex, 'quebec', 'Mail QC');
  };

  return (
    <>
      {clients.map((client, index) => (
        <Box
          key={index}
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
                  handleClientChange(index, 'title', null, null, e.target.value)
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
                  handleClientChange(index, 'name', null, null, e.target.value)
                }
                width="75%"
              />
              <IconButton
                aria-label="Remove Client"
                borderRadius="50px"
                icon={<AiOutlineClose size="20px" />}
                onClick={() => removeClient(index)}
                colorScheme="red"
                size="md"
                variant="ghost"
                mr={'5px'}
              />
            </HStack>
          </FormControl>

          {/* Draggable and Sortable Years */}
          <DragDropContext onDragEnd={(result) => onDragEnd(result, index)}>
            <Droppable droppableId={`droppable-${index}`}>
              {(provided) => (
                <VStack
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  spacing={4}
                  align="start"
                  mb={4}
                >
                  {client.years.map((yearItem, yearIndex) => (
                    <Draggable
                      key={yearIndex}
                      draggableId={`draggable-${index}-${yearIndex}`}
                      index={yearIndex}
                    >
                      {(provided) => (
                        <HStack
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          spacing={1}
                          align="start"
                        >
                          {/* Remove Year */}
                          {client.years.length > 1 && (
                            <IconButton
                              aria-label="Remove Year"
                              icon={<AiOutlineClose />}
                              onClick={() => removeYear(index, yearIndex)}
                              colorScheme="red"
                              size="md"
                              variant="ghost"
                              borderRadius={'50px'}
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
                            {...provided.dragHandleProps}
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
                                index,
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
                                  index,
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
                                      index,
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
                                  onClick={() => handleMailQC(index, yearIndex)}
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
                                  index,
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
                          {client.years.length - 1 === yearIndex ? (
                            <IconButton
                              aria-label="Add Year"
                              icon={<AiOutlinePlus />}
                              onClick={() => addYear(index)}
                              colorScheme="red"
                              size="md"
                              variant="ghost"
                              borderRadius="50px"
                              width="40px"
                            />
                          ) : (
                            <Box width="40px" />
                          )}
                        </HStack>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
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
