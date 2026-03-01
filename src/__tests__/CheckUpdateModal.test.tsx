import '@testing-library/jest-dom';
import React from 'react';
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import CheckUpdateModal from '../renderer/Components/modals/CheckUpdateModal';

let capturedOnUpdateAvailable: (() => void) | null = null;
let capturedOnUpdateNotAvailable: (() => void) | null = null;
let capturedOnUpdateError: (() => void) | null = null;

const mockElectron = {
  checkForUpdates: jest.fn().mockResolvedValue({ available: false }),
  onUpdateAvailable: jest.fn().mockImplementation((cb) => {
    capturedOnUpdateAvailable = cb;
    return jest.fn();
  }),
  onUpdateNotAvailable: jest.fn().mockImplementation((cb) => {
    capturedOnUpdateNotAvailable = cb;
    return jest.fn();
  }),
  onUpdateError: jest.fn().mockImplementation((cb) => {
    capturedOnUpdateError = cb;
    return jest.fn();
  }),
  downloadUpdate: jest.fn(),
};

Object.defineProperty(window, 'electron', {
  value: mockElectron,
  writable: true,
});

function renderModal(isOpen: boolean, onClose = jest.fn()) {
  return render(
    <ChakraProvider>
      <CheckUpdateModal isOpen={isOpen} onClose={onClose} />
    </ChakraProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  capturedOnUpdateAvailable = null;
  capturedOnUpdateNotAvailable = null;
  capturedOnUpdateError = null;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CheckUpdateModal', () => {
  describe('checking state', () => {
    it('shows spinner while status is "checking"', () => {
      mockElectron.checkForUpdates.mockImplementation(() => new Promise(() => {}));
      renderModal(true);
      expect(screen.getByText(/checking for updates\.\.\./i)).toBeInTheDocument();
    });

    it('does not render Close button during checking', () => {
      mockElectron.checkForUpdates.mockImplementation(() => new Promise(() => {}));
      renderModal(true);
      expect(
        screen.queryByRole('button', { name: /close/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('up-to-date state', () => {
    it('shows success message when onUpdateNotAvailable fires', async () => {
      mockElectron.checkForUpdates.mockImplementation(() => new Promise(() => {}));
      renderModal(true);
      await act(async () => {
        capturedOnUpdateNotAvailable?.();
      });
      expect(
        screen.getByText(/You're running the latest version/i),
      ).toBeInTheDocument();
    });

    it('shows success message after 5-second timeout when no events fire', async () => {
      mockElectron.checkForUpdates.mockResolvedValue({ available: true });
      renderModal(true);
      await act(async () => {
        await Promise.resolve();
      });
      await act(async () => {
        jest.advanceTimersByTime(5500);
      });
      expect(
        screen.getByText(/You're running the latest version/i),
      ).toBeInTheDocument();
    });

    it('shows Close button in up-to-date state', async () => {
      mockElectron.checkForUpdates.mockImplementation(() => new Promise(() => {}));
      renderModal(true);
      await act(async () => {
        capturedOnUpdateNotAvailable?.();
      });
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });

  describe('update-available state', () => {
    it('shows update available message when onUpdateAvailable fires', async () => {
      mockElectron.checkForUpdates.mockImplementation(() => new Promise(() => {}));
      renderModal(true);
      await act(async () => {
        capturedOnUpdateAvailable?.();
      });
      expect(screen.getByText(/A new update is available/i)).toBeInTheDocument();
    });

    it('shows Download Update button in update-available state', async () => {
      mockElectron.checkForUpdates.mockImplementation(() => new Promise(() => {}));
      renderModal(true);
      await act(async () => {
        capturedOnUpdateAvailable?.();
      });
      expect(
        screen.getByRole('button', { name: /download update/i }),
      ).toBeInTheDocument();
    });

    it('calls downloadUpdate and onClose when Download Update is clicked', async () => {
      mockElectron.checkForUpdates.mockImplementation(() => new Promise(() => {}));
      const onClose = jest.fn();
      renderModal(true, onClose);
      await act(async () => {
        capturedOnUpdateAvailable?.();
      });
      fireEvent.click(screen.getByRole('button', { name: /download update/i }));
      expect(mockElectron.downloadUpdate).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('error state', () => {
    it('shows error message when check throws', async () => {
      mockElectron.checkForUpdates.mockRejectedValueOnce(new Error('network'));
      renderModal(true);
      await waitFor(() => {
        expect(
          screen.getByText(/Unable to check for updates/i),
        ).toBeInTheDocument();
      });
    });

    it('shows error message when onUpdateError fires', async () => {
      mockElectron.checkForUpdates.mockImplementation(() => new Promise(() => {}));
      renderModal(true);
      await act(async () => {
        capturedOnUpdateError?.();
      });
      expect(
        screen.getByText(/Unable to check for updates/i),
      ).toBeInTheDocument();
    });

    it('shows Close button in error state', async () => {
      mockElectron.checkForUpdates.mockRejectedValueOnce(new Error('network'));
      renderModal(true);
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /close/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe('dev-mode state', () => {
    it('shows dev-mode message when result has a message field', async () => {
      mockElectron.checkForUpdates.mockResolvedValueOnce({
        available: false,
        message: 'Updates only available in production build',
      });
      renderModal(true);
      await waitFor(() => {
        expect(screen.getByText(/Updates not available/i)).toBeInTheDocument();
      });
    });
  });

  describe('modal not open', () => {
    it('does not call checkForUpdates when modal is closed', () => {
      renderModal(false);
      expect(mockElectron.checkForUpdates).not.toHaveBeenCalled();
    });
  });
});
