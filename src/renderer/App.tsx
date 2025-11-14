import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';

import HomePage from './Components/pages';
import SummaryComponent from './Components/pages/Summary';
import ConfirmationComponent from './Components/Confirmation';
import DataReviewComponent from './Components/pages/DataReview';
import EmailAutomationComponent from './Components/pages/EmailAutomation';
import AdminSettingsComponent from './Components/pages/AdminSettings';
import UpdateModal from './Components/UpdateModal';
import { MainLayout } from './Components/layout';
import theme from './theme';

import './App.css';

export default function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/summary" element={<SummaryComponent />} />
            <Route path="/confirmation" element={<ConfirmationComponent />} />
            <Route path="/data-review" element={<DataReviewComponent />} />
            <Route
              path="/email-automation"
              element={<EmailAutomationComponent />}
            />
            <Route
              path="/admin-settings"
              element={<AdminSettingsComponent />}
            />
          </Routes>
        </MainLayout>
      </Router>
      <UpdateModal />
    </ChakraProvider>
  );
}
