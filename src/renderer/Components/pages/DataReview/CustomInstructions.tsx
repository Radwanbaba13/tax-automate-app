import React from 'react';
import { Text, Button, Textarea } from '@chakra-ui/react';
import { MdTune } from 'react-icons/md';
import SectionCard from '../../common/SectionCard';

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
    <SectionCard
      icon={<MdTune size={18} />}
      title="Custom Instructions"
      actions={
        <Button
          size="xs"
          variant="ghost"
          colorScheme="purple"
          onClick={onNewReview}
        >
          New Review
        </Button>
      }
      contentProps={{ p: 4 }}
    >
      <Text fontSize="xs" color="gray.500" mb={3}>
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
    </SectionCard>
  );
}

export default CustomInstructions;
