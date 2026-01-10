import React from 'react';
import { Input, InputProps } from '@chakra-ui/react';

type FormInputVariant = 'primary' | 'secondary';

interface FormInputProps extends Omit<InputProps, 'variant'> {
  variant?: FormInputVariant;
}

const variantStyles = {
  primary: {
    color: '#cf3350',
    borderBottom: '2px solid #cf3350',
    _focus: {
      borderBottom: '3px solid #cf3350',
      boxShadow: 'none',
    },
    _hover: {
      borderBottom: '3px solid #cf3350',
    },
    _placeholder: {
      color: '#cf3350',
      opacity: '0.6',
      fontSize: '12px',
    },
  },
  secondary: {
    color: '#386498',
    borderBottom: '2px solid #386498',
    _focus: {
      borderBottom: '3px solid #386498',
      boxShadow: 'none',
    },
    _hover: {
      borderBottom: '3px solid #386498',
    },
    _placeholder: {
      color: '#386498',
      opacity: '0.6',
      fontSize: '12px',
    },
  },
};

function FormInput({ variant = 'primary', ...props }: FormInputProps) {
  const styles = variantStyles[variant];

  return (
    <Input
      border="none"
      borderRadius="0px"
      fontWeight="bold"
      fontSize="14px"
      {...styles}
      {...props}
    />
  );
}

export default FormInput;
