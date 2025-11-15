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
  Progress,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { FiDownload, FiCheckCircle } from 'react-icons/fi';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UpdateStage = 'confirm' | 'downloading' | 'downloaded' | 'installing';

function UpdateModal({ isOpen, onClose }: UpdateModalProps) {
  const [stage, setStage] = React.useState<UpdateStage>('confirm');
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownloadUpdate = async () => {
    setStage('downloading');
    setIsDownloading(true);
    try {
      await window.electron.downloadUpdate();
    } catch (error) {
      console.error('Failed to download update:', error);
      setIsDownloading(false);
      onClose();
    }
  };

  const handleInstallUpdate = () => {
    setStage('installing');
    window.electron.installUpdate();
  };

  React.useEffect(() => {
    // Listen for download progress
    window.electron.onUpdateDownloadProgress((progress: any) => {
      setDownloadProgress(progress.percent);
    });

    // Listen for download complete
    window.electron.onUpdateDownloaded(() => {
      setStage('downloaded');
      setIsDownloading(false);
    });
  }, []);

  // Reset stage when modal is opened/closed
  React.useEffect(() => {
    if (isOpen) {
      setStage('confirm');
      setDownloadProgress(0);
      setIsDownloading(false);
    }
  }, [isOpen]);

  const getModalContent = () => {
    switch (stage) {
      case 'confirm':
        return (
          <>
            <ModalHeader>Update Available</ModalHeader>
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text>
                  A new version of the application is available. Would you like
                  to download and install it now?
                </Text>
                <Text fontSize="sm" color="gray.600">
                  The update will be downloaded in the background. You can
                  continue working while it downloads.
                </Text>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Later
              </Button>
              <Button colorScheme="blue" onClick={handleDownloadUpdate}>
                Download Update
              </Button>
            </ModalFooter>
          </>
        );

      case 'downloading':
        return (
          <>
            <ModalHeader>Downloading Update</ModalHeader>
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <HStack spacing={3}>
                  <Icon as={FiDownload} boxSize={5} color="blue.500" />
                  <Text>Downloading update...</Text>
                </HStack>
                <Progress
                  value={downloadProgress}
                  size="sm"
                  colorScheme="blue"
                  borderRadius="md"
                  hasStripe
                  isAnimated
                />
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  {Math.round(downloadProgress)}% complete
                </Text>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Text fontSize="sm" color="gray.500">
                Please wait while the update downloads...
              </Text>
            </ModalFooter>
          </>
        );

      case 'downloaded':
        return (
          <>
            <ModalHeader>Update Ready</ModalHeader>
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <HStack spacing={3}>
                  <Icon as={FiCheckCircle} boxSize={5} color="green.500" />
                  <Text>Update downloaded successfully!</Text>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  The application will restart to install the update.
                </Text>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Install Later
              </Button>
              <Button colorScheme="green" onClick={handleInstallUpdate}>
                Install and Restart
              </Button>
            </ModalFooter>
          </>
        );

      case 'installing':
        return (
          <>
            <ModalHeader>Installing Update</ModalHeader>
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text textAlign="center">
                  Installing update and restarting...
                </Text>
                <Progress
                  size="sm"
                  isIndeterminate
                  colorScheme="green"
                  borderRadius="md"
                />
              </VStack>
            </ModalBody>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={stage === 'downloading' || stage === 'installing' ? () => {} : onClose}
      closeOnOverlayClick={stage !== 'downloading' && stage !== 'installing'}
      closeOnEsc={stage !== 'downloading' && stage !== 'installing'}
      isCentered
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent>{getModalContent()}</ModalContent>
    </Modal>
  );
}

export default UpdateModal;
