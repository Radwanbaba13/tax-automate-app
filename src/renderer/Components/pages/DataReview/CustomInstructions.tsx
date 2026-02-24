import React from 'react';
import {
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Textarea,
} from '@chakra-ui/react';
import { Card } from '../../common';

interface CustomInstructionsProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onNewReview: () => void;
}

function CustomInstructions({
  prompt,
  onPromptChange,
  onNewReview,
}: CustomInstructionsProps) {
  return (
    <Card p={4}>
      <VStack spacing={3} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading size="sm" color="gray.800">
            Custom Instructions
          </Heading>
          <Button
            size="xs"
            variant="ghost"
            colorScheme="purple"
            onClick={onNewReview}
          >
            New Review
          </Button>
        </HStack>
        <Text fontSize="xs" color="gray.500">
          Add specific areas to focus on or additional comparison rules. Base
          security rules are automatically enforced (no personal info in output,
          errors-only reporting).
        </Text>
        <Textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={5}
          resize="vertical"
          fontSize="sm"
          placeholder="E.g., Pay special attention to Box 14, Check for common transposition errors in amounts..."
        />
      </VStack>
    </Card>
  );
}

export default CustomInstructions;
