import React, { useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import AppToast, { ToastStatus } from '../Components/common/Toast';

// Module-level counter shared across all hook instances (one toast store globally)
let activeToastCount = 0;
const MAX_TOASTS = 5;

interface AppToastOptions {
  title: string;
  description?: string;
  status: ToastStatus;
  duration?: number;
  id?: string;
}

type ShowToastFn = (options: AppToastOptions) => void;

function useAppToast(): ShowToastFn {
  const toast = useToast({
    position: 'top-right',
  });

  const showToast = useCallback(
    (options: AppToastOptions) => {
      if (activeToastCount >= MAX_TOASTS) return;

      const { title, description, status, duration, id } = options;

      const defaultDuration =
        status === 'error' ? 5000 : status === 'warning' ? 4000 : 3000;

      activeToastCount += 1;

      toast({
        id,
        duration: duration ?? defaultDuration,
        isClosable: true,
        onCloseComplete: () => {
          activeToastCount = Math.max(0, activeToastCount - 1);
        },
        render: ({ onClose }) => (
          <AppToast
            status={status}
            title={title}
            description={description}
            onClose={onClose}
          />
        ),
      });
    },
    [toast],
  );

  return showToast;
}

export default useAppToast;
