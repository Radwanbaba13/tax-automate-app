import React from 'react';
import { HStack, Box } from '@chakra-ui/react';

interface Option {
  label: string;
  value: string;
}

const variantColors = {
  primary: '#cf3350',
  secondary: '#386498',
};

interface OptionChipsProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'primary' | 'secondary';
}

function OptionChips({
  options,
  value,
  onChange,
  variant = 'primary',
}: OptionChipsProps) {
  const activeColor = variantColors[variant];

  return (
    <HStack spacing={2} flexWrap="wrap">
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Box
            key={option.value}
            as="button"
            type="button"
            onClick={() => onChange(option.value)}
            px={3}
            py={1}
            borderRadius="full"
            fontSize="13px"
            fontWeight="bold"
            bg={isSelected ? activeColor : 'transparent'}
            color={isSelected ? 'white' : 'gray.500'}
            border="1.5px solid"
            borderColor={isSelected ? activeColor : 'gray.300'}
            transition="all 0.15s"
            _hover={{
              borderColor: activeColor,
              color: isSelected ? 'white' : activeColor,
            }}
          >
            {option.label}
          </Box>
        );
      })}
    </HStack>
  );
}

export default OptionChips;
