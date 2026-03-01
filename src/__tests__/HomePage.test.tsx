import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../renderer/Components/pages/index';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockElectron = {
  getAppVersion: jest.fn().mockResolvedValue('1.2.3'),
  checkForUpdates: jest.fn().mockResolvedValue({ available: false }),
  onUpdateAvailable: jest.fn().mockReturnValue(jest.fn()),
  onUpdateNotAvailable: jest.fn().mockReturnValue(jest.fn()),
  onUpdateError: jest.fn().mockReturnValue(jest.fn()),
  downloadUpdate: jest.fn(),
};

Object.defineProperty(window, 'electron', {
  value: mockElectron,
  writable: true,
});

function renderHomePage() {
  return render(
    <ChakraProvider>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </ChakraProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('HomePage', () => {
  it('renders all 4 module card titles', () => {
    renderHomePage();
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Confirmation')).toBeInTheDocument();
    expect(screen.getByText('Data Review')).toBeInTheDocument();
    expect(screen.getByText('Email Automation')).toBeInTheDocument();
  });

  it('renders the subtitle text', () => {
    renderHomePage();
    expect(
      screen.getByText('Select a module below to get started'),
    ).toBeInTheDocument();
  });

  it('renders the page heading', () => {
    renderHomePage();
    expect(screen.getByText('Tax Automation Modules')).toBeInTheDocument();
  });

  it('fetches and displays the app version', async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText(/Version 1\.2\.3/)).toBeInTheDocument();
    });
    expect(mockElectron.getAppVersion).toHaveBeenCalledTimes(1);
  });

  it('navigates to /summary when Summary card is clicked', () => {
    renderHomePage();
    fireEvent.click(screen.getByText('Summary'));
    expect(mockNavigate).toHaveBeenCalledWith('/summary');
  });

  it('navigates to /confirmation when Confirmation card is clicked', () => {
    renderHomePage();
    fireEvent.click(screen.getByText('Confirmation'));
    expect(mockNavigate).toHaveBeenCalledWith('/confirmation');
  });

  it('navigates to /data-review when Data Review card is clicked', () => {
    renderHomePage();
    fireEvent.click(screen.getByText('Data Review'));
    expect(mockNavigate).toHaveBeenCalledWith('/data-review');
  });

  it('navigates to /email-automation when Email Automation card is clicked', () => {
    renderHomePage();
    fireEvent.click(screen.getByText('Email Automation'));
    expect(mockNavigate).toHaveBeenCalledWith('/email-automation');
  });

  it('renders each card description', () => {
    renderHomePage();
    expect(
      screen.getByText(/Generate comprehensive summary documents/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Create professional confirmation documents/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Review and validate all processed data/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Automate email sending/)).toBeInTheDocument();
  });
});
