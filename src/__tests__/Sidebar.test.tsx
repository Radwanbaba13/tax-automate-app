import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../renderer/Components/layout/Sidebar';

let capturedOnUpdateAvailable: (() => void) | null = null;
let capturedOnUpdateNotAvailable: (() => void) | null = null;
let capturedOnUpdateError: (() => void) | null = null;

const mockElectron = {
  getAppVersion: jest.fn().mockResolvedValue('1.5.0'),
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
  onUpdateDownloaded: jest.fn().mockReturnValue(jest.fn()),
};

Object.defineProperty(window, 'electron', {
  value: mockElectron,
  writable: true,
});

jest.mock('../renderer/Components/modals/UpdateModal', () => ({
  __esModule: true,
  default: () => null,
}));

function renderSidebar(initialPath = '/') {
  return render(
    <ChakraProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Sidebar />
      </MemoryRouter>
    </ChakraProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  capturedOnUpdateAvailable = null;
  capturedOnUpdateNotAvailable = null;
  capturedOnUpdateError = null;
});

describe('Sidebar', () => {
  it('calls getAppVersion on mount and displays the version', async () => {
    renderSidebar();
    await waitFor(() => {
      expect(screen.getByText(/1\.5\.0/)).toBeInTheDocument();
    });
    expect(mockElectron.getAppVersion).toHaveBeenCalledTimes(1);
  });

  it('calls checkForUpdates automatically on mount', async () => {
    renderSidebar();
    await waitFor(() => {
      expect(mockElectron.checkForUpdates).toHaveBeenCalledTimes(1);
    });
  });

  it('registers all 3 IPC event listeners on mount', () => {
    renderSidebar();
    expect(mockElectron.onUpdateAvailable).toHaveBeenCalledTimes(1);
    expect(mockElectron.onUpdateNotAvailable).toHaveBeenCalledTimes(1);
    expect(mockElectron.onUpdateError).toHaveBeenCalledTimes(1);
  });

  it('shows "Up to date" when onUpdateNotAvailable fires', async () => {
    renderSidebar();
    await act(async () => {
      capturedOnUpdateNotAvailable?.();
    });
    expect(screen.getByText(/up to date/i)).toBeInTheDocument();
  });

  it('shows "Update Now" button when onUpdateAvailable fires', async () => {
    renderSidebar();
    await act(async () => {
      capturedOnUpdateAvailable?.();
    });
    expect(
      screen.getByRole('button', { name: /update now/i }),
    ).toBeInTheDocument();
  });

  it('shows "Check again" when onUpdateError fires', async () => {
    renderSidebar();
    await act(async () => {
      capturedOnUpdateError?.();
    });
    expect(screen.getByText(/check again/i)).toBeInTheDocument();
  });

  it('renders nav items for all modules', () => {
    renderSidebar();
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Confirmation')).toBeInTheDocument();
    expect(screen.getByText('Data Review')).toBeInTheDocument();
    expect(screen.getByText('Email Automation')).toBeInTheDocument();
    expect(screen.getByText('Admin Settings')).toBeInTheDocument();
  });
});
