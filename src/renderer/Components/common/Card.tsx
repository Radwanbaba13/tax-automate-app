import React from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

interface CardProps extends BoxProps {
  children: React.ReactNode;
}

function Card({ children, ...props }: CardProps) {
  return (
    <Box
      bg="white"
      borderRadius="12px"
      boxShadow="0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)"
      border="1px solid #edf2f7"
      p={6}
      {...props}
    >
      {children}
    </Box>
  );
}

export default Card;
