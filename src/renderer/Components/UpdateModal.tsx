import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Progress,
  VStack,
  HStack,
  Icon,
  Box,
} from '@chakra-ui/react';
import { FiDownload, FiAlertCircle } from 'react-icons/fi';
import { showToast } from '../Utils/toast';

interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

interface ProgressInfo {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

function UpdateModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  const unsubAvailableRef = React.useRef<(() => void) | null>(null);

  useEffect(() => {
    // Listen for update available — store unsub so we can stop auto-reopening after user dismisses
    const unsub = window.electron.onUpdateAvailable((info: UpdateInfo) => {
      setUpdateInfo(info);
      setIsOpen(true);
      setIsDownloading(false);
      setUpdateDownloaded(false);
    });
    unsubAvailableRef.current = unsub;

    // Listen for download progress
    window.electron.onUpdateDownloadProgress((progress: ProgressInfo) => {
      setDownloadProgress(Math.round(progress.percent));
    });

    // Listen for update downloaded
    window.electron.onUpdateDownloaded((info: UpdateInfo) => {
      setUpdateDownloaded(true);
      setIsDownloading(false);
      setUpdateInfo(info);
    });

    // Listen for update errors
    window.electron.onUpdateError(() => {
      showToast({
        title: 'Update Error',
        description:
          'There was an error checking for updates. Please try again later.',
        status: 'error',
        duration: 5000,
      });
      setIsOpen(false);
      setIsDownloading(false);
    });

    // Listen for update not available
    window.electron.onUpdateNotAvailable(() => {
      // Silently handle - no update available
    });
  }, []);

  const handleDownloadUpdate = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    try {
      await window.electron.downloadUpdate();
    } catch {
      showToast({
        title: 'Download Failed',
        description: 'Failed to download the update. Please try again.',
        status: 'error',
        duration: 5000,
      });
      setIsDownloading(false);
    }
  };

  const handleInstallUpdate = () => {
    window.electron.installUpdate();
  };

  const handleClose = () => {
    if (!isDownloading) {
      setIsOpen(false);
      // Stop auto-reopening on future update checks — Sidebar handles re-prompting via "Update Now"
      unsubAvailableRef.current?.();
      unsubAvailableRef.current = null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnOverlayClick={!isDownloading}
      closeOnEsc={!isDownloading}
      isCentered
      size="lg"
    >
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={3}>
            <Icon
              as={updateDownloaded ? FiDownload : FiAlertCircle}
              boxSize={6}
              color={updateDownloaded ? 'green.500' : 'blue.500'}
            />
            <Text>
              {updateDownloaded
                ? 'Update Ready to Install'
                : 'Update Available'}
            </Text>
          </HStack>
        </ModalHeader>

        <ModalBody>
          <VStack align="stretch" spacing={4}>
            {updateInfo && (
              <Box>
                <Text fontSize="md" fontWeight="semibold" mb={2}>
                  Version {updateInfo.version}
                </Text>
                {updateInfo.releaseDate && (
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Released:{' '}
                    {new Date(updateInfo.releaseDate).toLocaleDateString()}
                  </Text>
                )}
              </Box>
            )}

            {!updateDownloaded && !isDownloading && (
              <Text fontSize="sm" color="gray.700">
                A new version of the application is available. Would you like to
                download and install it now? The application will restart after
                installation.
              </Text>
            )}

            {isDownloading && (
              <VStack align="stretch" spacing={2}>
                <Text fontSize="sm" color="gray.700">
                  Downloading update... {downloadProgress}%
                </Text>
                <Progress
                  value={downloadProgress}
                  size="sm"
                  colorScheme="blue"
                  hasStripe
                  isAnimated
                />
              </VStack>
            )}

            {updateDownloaded && (
              <VStack align="stretch" spacing={2}>
                <Text fontSize="sm" color="green.600" fontWeight="medium">
                  ✓ Update downloaded successfully
                </Text>
                <Text fontSize="sm" color="gray.700">
                  The update is ready to install. Click &quot;Install &amp;
                  Restart&quot; to complete the update. Your work will be saved
                  automatically.
                </Text>
              </VStack>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            {!isDownloading && !updateDownloaded && (
              <>
                <Button variant="ghost" onClick={handleClose}>
                  Later
                </Button>
                <Button colorScheme="blue" onClick={handleDownloadUpdate}>
                  Download & Install
                </Button>
              </>
            )}

            {isDownloading && (
              <Button
                isDisabled
                colorScheme="blue"
                isLoading
                loadingText="Downloading"
              >
                Downloading
              </Button>
            )}

            {updateDownloaded && (
              <>
                <Button variant="ghost" onClick={handleClose}>
                  Install Later
                </Button>
                <Button colorScheme="green" onClick={handleInstallUpdate}>
                  Install & Restart
                </Button>
              </>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default UpdateModal;
