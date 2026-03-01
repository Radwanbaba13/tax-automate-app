import React from 'react';
import { Select, SelectProps } from '@chakra-ui/react';

type FormSelectVariant = 'primary' | 'secondary' | 'neutral';

interface FormSelectProps extends Omit<SelectProps, 'variant'> {
  variant?: FormSelectVariant;
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
  neutral: {
    color: '#757575',
    borderBottom: '2px solid #757575',
    _focus: {
      borderBottom: '3px solid #757575',
      boxShadow: 'none',
    },
    _hover: {
      borderBottom: '3px solid #757575',
    },
    _placeholder: {
      color: '#757575',
      opacity: '0.6',
      fontSize: '12px',
    },
  },
};

function FormSelect({
  variant = 'primary',
  children,
  ...props
}: FormSelectProps) {
  const styles = variantStyles[variant];

  return (
    <Select
      border="none"
      borderRadius="0px"
      fontWeight="bold"
      fontSize="14px"
      {...styles}
      {...props}
    >
      {children}
    </Select>
  );
}

export default FormSelect;
