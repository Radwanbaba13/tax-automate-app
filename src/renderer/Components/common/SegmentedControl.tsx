import React from 'react';
import { HStack, Button } from '@chakra-ui/react';

interface Option {
  label: string;
  value: string;
  colorScheme?: string;
}

interface SegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  colorScheme?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
}

function SegmentedControl({
  options,
  value,
  onChange,
  colorScheme = 'primary',
  size = 'sm',
}: SegmentedControlProps) {
  const defaultActiveColorScheme = colorScheme === 'primary' ? 'red' : 'blue';

  return (
    <HStack spacing={1}>
      {options.map((option) => {
        const isActive = option.value === value;
        const activeColorScheme = option.colorScheme ?? defaultActiveColorScheme;
        return (
          <Button
            key={option.value}
            size={size}
            colorScheme={isActive ? activeColorScheme : 'gray'}
            variant={isActive ? 'solid' : 'outline'}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </HStack>
  );
}

export default SegmentedControl;
