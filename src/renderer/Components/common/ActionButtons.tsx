import React from 'react';
import {
  IconButton,
  Button,
  IconButtonProps,
  ButtonProps,
} from '@chakra-ui/react';
import { IoClose } from 'react-icons/io5';
import { FaPlus } from 'react-icons/fa';

// Delete Icon Button
interface DeleteButtonProps
  extends Omit<IconButtonProps, 'aria-label' | 'icon'> {
  label?: string;
  iconSize?: string;
}

export function DeleteButton({
  label = 'Delete',
  iconSize = '25px',
  ...props
}: DeleteButtonProps) {
  return (
    <IconButton
      aria-label={label}
      icon={<IoClose color="grey" size={iconSize} />}
      variant="ghost"
      borderRadius="25px"
      {...props}
    />
  );
}

// Add Row Button
interface AddRowButtonProps extends Omit<ButtonProps, 'leftIcon'> {
  label?: string;
}

export function AddRowButton({
  label = 'Add New Row',
  ...props
}: AddRowButtonProps) {
  return (
    <Button
      aria-label="Add"
      leftIcon={<FaPlus color="#cf3350" />}
      variant="ghost"
      borderRadius="25px"
      ml="15px"
      fontWeight="bold"
      color="#cf3350"
      {...props}
    >
      {label}
    </Button>
  );
}
