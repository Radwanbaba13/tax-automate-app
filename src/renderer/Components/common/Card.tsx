import React from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

interface CardProps extends BoxProps {
  children: React.ReactNode;
}

function Card({ children, ...props }: CardProps) {
  return (
    <Box
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
      p={6}
      {...props}
    >
      {children}
    </Box>
  );
}

export default Card;
