import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  VStack,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';

interface CheckUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CheckStatus =
  | 'checking'
  | 'up-to-date'
  | 'update-available'
  | 'error'
  | 'dev-mode';

function CheckUpdateModal({ isOpen, onClose }: CheckUpdateModalProps) {
  const [status, setStatus] = React.useState<CheckStatus>('checking');

  const performCheck = React.useCallback(async () => {
    setStatus('checking');
    try {
      const result = await window.electron.checkForUpdates();

      // Handle development mode response
      if (result && !result.available && result.message) {
        setStatus('dev-mode');
        return;
      }

      // If there's an error in the result
      if (result && result.error) {
        setStatus('error');
        return;
      }

      // The update events will handle setting the status for production builds.
      // If no events fire within 5 seconds, treat as error rather than silently
      // showing "up to date" (a timeout ≠ confirmed up-to-date).
      setTimeout(() => {
        setStatus((currentStatus) => {
          if (currentStatus === 'checking') {
            return 'error';
          }
          return currentStatus;
        });
      }, 5000);
    } catch {
      setStatus('error');
    }
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;

    performCheck();

    const unsubAvailable = window.electron.onUpdateAvailable(() => {
      setStatus('update-available');
    });

    const unsubNotAvailable = window.electron.onUpdateNotAvailable(() => {
      setStatus('up-to-date');
    });

    const unsubError = window.electron.onUpdateError(() => {
      setStatus('error');
    });

    return () => {
      unsubAvailable?.();
      unsubNotAvailable?.();
      unsubError?.();
    };
  }, [isOpen, performCheck]);

  const getModalContent = () => {
    switch (status) {
      case 'checking':
        return (
          <>
            <ModalHeader>Checking for Updates</ModalHeader>
            <ModalBody>
              <VStack spacing={4} align="center" py={4}>
                <Spinner size="lg" color="blue.500" thickness="4px" />
                <Text color="gray.600">Checking for updates...</Text>
              </VStack>
            </ModalBody>
          </>
        );

      case 'up-to-date':
        return (
          <>
            <ModalHeader>Up to Date</ModalHeader>
            <ModalBody>
              <VStack spacing={4} align="center" py={4}>
                <Icon as={FiCheckCircle} boxSize={12} color="green.500" />
                <Text color="gray.700" fontSize="lg" fontWeight="500">
                  You're running the latest version!
                </Text>
                <Text color="gray.600" fontSize="sm">
                  Your application is up to date.
                </Text>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="green" onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        );

      case 'update-available':
        return (
          <>
            <ModalHeader>Update Available</ModalHeader>
            <ModalBody>
              <VStack spacing={4} align="center" py={4}>
                <Icon as={FiAlertCircle} boxSize={12} color="orange.500" />
                <Text color="gray.700" fontSize="lg" fontWeight="500">
                  A new update is available!
                </Text>
                <Text color="gray.600" fontSize="sm" textAlign="center">
                  A new version of the application is ready to download.
                </Text>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Later
              </Button>
              <Button
                colorScheme="orange"
                onClick={() => {
                  window.electron.downloadUpdate();
                  onClose();
                }}
              >
                Download Update
              </Button>
            </ModalFooter>
          </>
        );

      case 'error':
        return (
          <>
            <ModalHeader>Check Failed</ModalHeader>
            <ModalBody>
              <VStack spacing={4} align="center" py={4}>
                <Icon as={FiAlertCircle} boxSize={12} color="red.500" />
                <Text color="gray.700" fontSize="lg" fontWeight="500">
                  Unable to check for updates
                </Text>
                <Text color="gray.600" fontSize="sm" textAlign="center">
                  Please check your internet connection and try again.
                </Text>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Close
              </Button>
              <Button colorScheme="red" onClick={performCheck}>
                Try Again
              </Button>
            </ModalFooter>
          </>
        );

      case 'dev-mode':
        return (
          <>
            <ModalHeader>Development Mode</ModalHeader>
            <ModalBody>
              <VStack spacing={4} align="center" py={4}>
                <Icon as={FiInfo} boxSize={12} color="blue.500" />
                <Text color="gray.700" fontSize="lg" fontWeight="500">
                  Updates not available
                </Text>
                <Text color="gray.600" fontSize="sm" textAlign="center">
                  Update checks are only available in production builds.
                </Text>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={status === 'checking' ? () => {} : onClose}
      closeOnEsc={status !== 'checking'}
      closeOnOverlayClick={status !== 'checking'}
      isCentered
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent>{getModalContent()}</ModalContent>
    </Modal>
  );
}

export default CheckUpdateModal;
