import React from 'react';
import { Box, HStack, VStack, Text, Icon, IconButton } from '@chakra-ui/react';
import { IoClose } from 'react-icons/io5';
import { FiAlertCircle, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { IconType } from 'react-icons';

export type ToastStatus = 'error' | 'success' | 'warning';

export interface AppToastProps {
  status: ToastStatus;
  title: string;
  description?: string;
  onClose: () => void;
}

interface ToastStyleConfig {
  borderColor: string;
  bg: string;
  color: string;
  icon: IconType;
}

const toastConfig: Record<ToastStatus, ToastStyleConfig> = {
  error: {
    borderColor: 'red.700',
    bg: 'red.600',
    color: 'white',
    icon: FiAlertCircle,
  },
  success: {
    borderColor: 'green.700',
    bg: 'green.600',
    color: 'white',
    icon: FiCheckCircle,
  },
  warning: {
    borderColor: 'orange.600',
    bg: 'orange.500',
    color: 'white',
    icon: FiAlertTriangle,
  },
};

function AppToast({ status, title, description, onClose }: AppToastProps) {
  const { bg, color, icon } = toastConfig[status];

  return (
    <Box
      bg={bg}
      borderRadius="lg"
      p={3}
      minW="360px"
      maxW="480px"
      boxShadow="0 8px 24px rgba(0,0,0,0.25)"
    >
      <HStack align="flex-start" spacing={2}>
        <Icon as={icon} boxSize={5} color={color} mt="4px" flexShrink={0} />
        <VStack align="flex-start" flex={1}>
          <Text fontWeight="700" fontSize="lg" color={color}>
            {title}
          </Text>
          {description && (
            <Text
              fontSize="md"
              color={color}
              opacity={0.9}
              lineHeight="short"
              mt="-10px"
            >
              {description}
            </Text>
          )}
        </VStack>
        <IconButton
          aria-label="Close notification"
          icon={<IoClose size="18px" />}
          size="sm"
          variant="ghost"
          color={color}
          _hover={{ bg: 'whiteAlpha.200' }}
          onClick={onClose}
          flexShrink={0}
          mt="-4px"
          mr="-4px"
        />
      </HStack>
    </Box>
  );
}

export default AppToast;
