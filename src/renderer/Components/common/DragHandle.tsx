import React from 'react';
import { Box, BoxProps } from '@chakra-ui/react';
import { MdDragHandle } from 'react-icons/md';

interface DragHandleProps extends Omit<BoxProps, 'cursor'> {
  size?: string;
  hoverColor?: string;
}

function DragHandle({
  size = '25px',
  hoverColor = '#cf3350',
  ...props
}: DragHandleProps) {
  return (
    <Box cursor="grab" _hover={{ color: hoverColor }} {...props}>
      <MdDragHandle size={size} />
    </Box>
  );
}

export default DragHandle;
