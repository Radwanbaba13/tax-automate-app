import React from 'react';
import {
  Box,
  HStack,
  Button,
  IconButton,
  Divider,
  Text,
  Select,
  Switch,
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
      borderRadius="md"
      bg="gray.50"
      p={4}
      boxShadow="sm"
      borderColor="brand.200"
    >
      <HStack spacing={1}>
        {TITLE_OPTIONS.map((title) => (
          <Button
            key={title.value}
            onClick={() => onUpdateFile(index, { title: title.value })}
            size="sm"
            colorScheme={fileItem.title === title.value ? 'brand' : 'gray'}
            variant={fileItem.title === title.value ? 'solid' : 'outline'}
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
            onClick={() => onRemoveFile(index)}
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
        <Text fontWeight="bold">{fileItem.label || 'Untitled File'}</Text>

        <HStack spacing={2}>
          <Button
            onClick={() =>
              onUpdateFile(index, { isNewcomer: !fileItem.isNewcomer })
            }
            size="sm"
            colorScheme={fileItem.isNewcomer ? 'brand' : 'gray'}
            variant={fileItem.isNewcomer ? 'solid' : 'outline'}
          >
            <Switch
              isChecked={fileItem.isNewcomer}
              onChange={() =>
                onUpdateFile(index, { isNewcomer: !fileItem.isNewcomer })
              }
              colorScheme="red"
              size="md"
              marginRight="8px"
            />
            Newcomer
          </Button>

          <Button
            onClick={() =>
              onUpdateFile(index, { isMailQC: !fileItem.isMailQC })
            }
            size="sm"
            colorScheme={fileItem.isMailQC ? 'blue' : 'gray'}
            variant={fileItem.isMailQC ? 'solid' : 'outline'}
          >
            <Switch
              isChecked={fileItem.isMailQC}
              onChange={() =>
                onUpdateFile(index, { isMailQC: !fileItem.isMailQC })
              }
              colorScheme="blue"
              size="md"
              marginRight="8px"
            />
            Mail QC
          </Button>
        </HStack>
      </HStack>

      {allFiles.length >= 2 && (
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
            <Switch
              isChecked={fileItem.isPrimary}
              onChange={() => {
                // Allow only one file to be primary
                const newPrimary = !fileItem.isPrimary;
                onUpdateFile(index, { isPrimary: newPrimary });
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
  );
}

export default ClientFileCard;
