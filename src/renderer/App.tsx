import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';

import SummaryComponent from './Components/SummaryComponent';
import ConfirmationComponent from './Components/ConfirmationComponent';

import './App.css';

export default function App() {
  return (
    <ChakraProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SummaryComponent />} />
          <Route path="/confirmation" element={<ConfirmationComponent />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}
