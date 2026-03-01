import React from 'react';
import { createStandaloneToast } from '@chakra-ui/react';
import AppToast, { ToastStatus } from '../Components/common/Toast';

const { ToastContainer, toast: _toast } = createStandaloneToast({
  defaultOptions: { position: 'bottom-right' },
  toastSpacing: '8px',
});

export { ToastContainer };

export interface ShowToastOptions {
  title: string;
  description?: string;
  status: ToastStatus;
  duration?: number;
  id?: string;
}

let activeToastCount = 0;
const MAX_TOASTS = 5;

export function showToast(options: ShowToastOptions): void {
  if (activeToastCount >= MAX_TOASTS) return;

  const { title, description, status, duration, id } = options;
  const defaultDuration =
    status === 'error' ? 5000 : status === 'warning' ? 4000 : 3000;

  activeToastCount += 1;

  _toast({
    id,
    position: 'bottom-right',
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
}
