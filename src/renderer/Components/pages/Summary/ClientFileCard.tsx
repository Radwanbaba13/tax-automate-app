import React from 'react';
import {
  Box,
  HStack,
  IconButton,
  Divider,
  Text,
  Select,
  Switch,
  FormLabel,
} from '@chakra-ui/react';
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

interface ClientFileCardProps {
  fileItem: ClientFile;
  index: number;
  allFiles: ClientFile[];
  onUpdateFile: (index: number, updates: Partial<ClientFile>) => void;
  onRemoveFile: (index: number) => void;
  onCoupleWithChange: (index: number, selectedValue: string) => void;
}

const TITLE_OPTIONS = [
  { display: 'Mr./M.', value: 'Mr' },
  { display: 'Mrs./Mme', value: 'Mrs' },
  { display: 'Ms./Mme', value: 'Ms' },
];

function ClientFileCard({
  fileItem,
  index,
  allFiles,
  onUpdateFile,
  onRemoveFile,
  onCoupleWithChange,
}: ClientFileCardProps) {
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      bg="white"
      p={4}
      boxShadow="sm"
      borderColor="gray.200"
    >
      {/* Row 1: Title selector + close button */}
      <HStack justify="space-between" align="center">
        <HStack spacing={1}>
          {TITLE_OPTIONS.map((title) => (
            <Box
              key={title.value}
              as="button"
              onClick={() => onUpdateFile(index, { title: title.value })}
              px={3}
              py={1}
              borderRadius="full"
              fontSize="xs"
              fontWeight="600"
              border="1.5px solid"
              cursor="pointer"
              transition="all 0.15s"
              bg={fileItem.title === title.value ? '#cf3350' : 'transparent'}
              color={fileItem.title === title.value ? 'white' : 'gray.500'}
              borderColor={
                fileItem.title === title.value ? '#cf3350' : 'gray.300'
              }
              _hover={{
                borderColor: '#cf3350',
                color: fileItem.title === title.value ? 'white' : '#cf3350',
              }}
            >
              {title.display}
            </Box>
          ))}
        </HStack>

        <IconButton
          aria-label="Remove Client"
          icon={<AiOutlineClose size="16px" />}
          onClick={() => onRemoveFile(index)}
          variant="ghost"
          colorScheme="gray"
          size="sm"
        />
      </HStack>

      <Divider my={3} />

      {/* Row 2: Client name + toggle switches */}
      <HStack justify="space-between" align="center">
        <Text fontWeight="600" fontSize="md" color="gray.800">
          {fileItem.label || 'Untitled File'}
        </Text>

        <HStack spacing={5}>
          <FormLabel
            htmlFor={`newcomer-${index}`}
            display="flex"
            alignItems="center"
            gap={2}
            mb={0}
            cursor="pointer"
            fontSize="sm"
            color="gray.600"
            fontWeight="500"
          >
            <Switch
              id={`newcomer-${index}`}
              isChecked={fileItem.isNewcomer}
              onChange={() =>
                onUpdateFile(index, { isNewcomer: !fileItem.isNewcomer })
              }
              colorScheme="brand"
              size="sm"
            />
            Newcomer
          </FormLabel>

          <FormLabel
            htmlFor={`mailqc-${index}`}
            display="flex"
            alignItems="center"
            gap={2}
            mb={0}
            cursor="pointer"
            fontSize="sm"
            color="gray.600"
            fontWeight="500"
          >
            <Switch
              id={`mailqc-${index}`}
              isChecked={fileItem.isMailQC}
              onChange={() =>
                onUpdateFile(index, { isMailQC: !fileItem.isMailQC })
              }
              colorScheme="blue"
              size="sm"
            />
            Mail QC
          </FormLabel>
        </HStack>
      </HStack>

      {/* Row 3: Couple-with selector (only when multiple files) */}
      {allFiles.length >= 2 && (
        <HStack spacing={4} mt={4} justify="space-between" align="center">
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
            onChange={(e) => onCoupleWithChange(index, e.target.value)}
            width="60%"
          >
            {allFiles
              .filter((_, i) => i !== index)
              .map((mappedFile, i) => (
                <option key={i} value={mappedFile.label}>
                  {mappedFile.label}
                </option>
              ))}
          </Select>

          {fileItem.coupleWith !== 'Individual Summary' && (
            <FormLabel
              htmlFor={`primary-${index}`}
              display="flex"
              alignItems="center"
              gap={2}
              mb={0}
              cursor="pointer"
              fontSize="sm"
              color="gray.600"
              fontWeight="500"
            >
              <Switch
                id={`primary-${index}`}
                isChecked={fileItem.isPrimary}
                onChange={() =>
                  onUpdateFile(index, { isPrimary: !fileItem.isPrimary })
                }
                colorScheme="green"
                size="sm"
              />
              Primary
            </FormLabel>
          )}
        </HStack>
      )}
    </Box>
  );
}

export default ClientFileCard;
