import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Input,
  Text,
  HStack,
  useToast,
  Checkbox,
  Select,
  InputGroup,
  FormControl,
  Heading,
  IconButton,
  VStack,
} from '@chakra-ui/react';
import ConfigurationSidebar from './ConfigurationSideBar';
import NavBar from './Navbar';
import { supabase } from '../Utils/supabaseClient';
import ClientDetails from './Confirmation/ClientDetails';
import PriceSelection from './Confirmation/PriceSelection';
import { MdAdd } from 'react-icons/md';
import { FaFolderOpen } from 'react-icons/fa';
import InvoiceDetails from './Confirmation/InvoiceDetails';

interface PriceListItem {
  service: { en: string; fr: string };
  amount: number;
  type: string;
}

interface TaxRateItem {
  province: string;
  fedRate: number;
  provRate: number;
}

function ConfirmationComponent() {
  const [clients, setClients] = useState([
    {
      title: '',
      name: '',
      years: [
        {
          year: '',
          confirmationNumbers: {
            federal: '',
            quebec: '',
            t1135: '',
          },
        },
      ],
    },
  ]);

  const [prices, setPrices] = useState<PriceListItem[]>([]);
  const [directory, setDirectory] = useState(null);
  const [taxRates, setTaxRates] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('QC');
  const [language, setLanguage] = useState('en');
  const [selectedPrices, setSelectedPrices] = useState<PriceListItem[]>([]);
  const [includeTaxes, setIncludeTaxes] = useState(true);
  const toast = useToast();

  // State for invoice details
  const [invoiceDetails, setInvoiceDetails] = useState({
    companyName: '',
    fullName: '',
    name: '',
    address: '',
    email: '',
    phoneNumber: '',
    notes: 'To be paid upon reception',
    invoiceNumber: 0,
  });

  useEffect(() => {
    if (clients[0]) {
      const translatedTitle = (title, language) => {
        if (language === 'fr') {
          switch (title) {
            case 'Mr':
              return 'M.';
            case 'Mrs':
              return 'Mme';
            case 'Ms':
              return 'Mme';
            default:
              return title;
          }
        }
        return `${title}.`;
      };

      // Example usage:
      const title = clients[0].title || '';
      const finalTitle = translatedTitle(title, language);

      const fullName = `${finalTitle} ${clients[0].name}`.trim();
      const name = clients[0].name || '';
      setInvoiceDetails((prev) => ({ ...prev, fullName, name }));
    }
  }, [clients[0]?.title, clients[0]?.name]);

  useEffect(() => {
    if (language === 'fr') {
      setInvoiceDetails((prevDetails) => ({
        ...prevDetails,
        notes: 'À payer à la réception',
      }));
    } else {
      setInvoiceDetails((prevDetails) => ({
        ...prevDetails,
        notes: 'To be paid upon reception',
      }));
    }
  }, [language]);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const { data, error } = await supabase
          .from('tax_rates')
          .select('province');

        if (error) throw error;

        setProvinces(data);
      } catch (error) {
        console.error('Error fetching provinces:');
        toast({
          title: 'Error Fetching Provinces',
          description: 'Could not fetch provinces. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    const fetchPrices = async () => {
      try {
        const { data, error } = await supabase.from('price_list').select('*');
        if (error) throw error;
        setPrices(data);
      } catch (error) {
        console.error('Error fetching prices');
        toast({
          title: 'Error Fetching Prices',
          description: 'Could not fetch prices. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    const fetchInvoiceNumber = async () => {
      try {
        const { data, error } = await supabase
          .from('invoice_number')
          .select('invoices')
          .single();

        if (error) throw error;
        setInvoiceDetails((prevDetails) => ({
          ...prevDetails,
          invoiceNumber: data.invoices || 1111,
        }));
      } catch (error) {
        console.error('Error fetching invoice number');
        toast({
          title: 'Error Fetching Invoice Number',
          description:
            'Could not fetch the invoice number. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    const savedDirectory = localStorage.getItem('directory');
    if (savedDirectory) {
      setDirectory({ path: savedDirectory });
    }

    fetchProvinces();
    fetchPrices();
    fetchInvoiceNumber();
  }, []);

  useEffect(() => {
    const fetchTaxRates = async (province) => {
      try {
        const { data, error } = await supabase
          .from('tax_rates')
          .select('*')
          .eq('province', province);

        if (error) throw error;
        setTaxRates(data);
      } catch (error) {
        console.error('Error fetching tax rates');
        toast({
          title: 'Error Fetching Tax Rates',
          description: 'Could not fetch tax rates. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchTaxRates(selectedProvince);
  }, [selectedProvince]);

  const addYear = (clientIndex) => {
    setClients((prevClients) => {
      // Create a new array to avoid mutating the state directly
      const updatedClients = prevClients.map((client, index) => {
        const updatedClient = { ...client };

        // If this is the client we want to add a year to
        if (index === clientIndex) {
          const newYear = {
            year: '',
            confirmationNumbers: {
              federal: '',
              quebec: '',
            },
          };
          updatedClient.years = [...updatedClient.years, newYear];
        } else {
          // Ensure this client has the same number of years as the target client
          if (client.years.length < prevClients[clientIndex].years.length) {
            const newYear = {
              year: '',
              confirmationNumbers: {
                federal: '',
                quebec: '',
              },
            };
            updatedClient.years = [...updatedClient.years, newYear];
          }
        }

        return updatedClient;
      });

      return updatedClients;
    });
  };

  const removeYear = (clientIndex, yearIndex) => {
    const updatedClients = [...clients];
    if (updatedClients[clientIndex].years.length > 1) {
      updatedClients.forEach((client) => {
        client.years.splice(yearIndex, 1);
      });
      setClients(updatedClients);
    }
  };

  const onDragEnd = (result, clientIndex) => {
    if (!result.destination) return;

    const updatedClients = [...clients];
    const [removed] = updatedClients[clientIndex].years.splice(
      result.source.index,
      1,
    );
    updatedClients[clientIndex].years.splice(
      result.destination.index,
      0,
      removed,
    );

    setClients(updatedClients);
  };

  // Inside the addClient function, initialize the years array
  const addClient = () => {
    setClients([
      ...clients,
      {
        title: '',
        name: '',
        years: [
          {
            year: '',
            confirmationNumbers: {
              federal: '',
              quebec: '',
            },
          },
        ],
      },
    ]);
  };

  // Update handleClientChange function to accommodate years
  function handleClientChange(clientIndex, field, yearIndex, yearField, value) {
    setClients((prevClients) => {
      return prevClients.map((client, i) => {
        if (i !== clientIndex) return client;

        if (field === 'years') {
          const updatedYears = client.years.map((yearItem, yi) => {
            if (yi !== yearIndex) return yearItem;

            return {
              ...yearItem,
              [yearField]: value,
            };
          });

          return {
            ...client,
            years: updatedYears,
          };
        }

        return {
          ...client,
          [field]: value,
        };
      });
    });
  }

  const handleConfirmationNumberChange = (
    clientIndex,
    yearIndex,
    type,
    value,
  ) => {
    const updatedClients = [...clients];

    // Ensure the specific year exists and update the confirmation number
    if (updatedClients[clientIndex].years[yearIndex]) {
      updatedClients[clientIndex].years[yearIndex].confirmationNumbers[type] =
        value;
      setClients(updatedClients);
    }
  };
  const removeClient = (index) => {
    setClients((prevClients) => prevClients.filter((_, i) => i !== index));
  };

  const openDirectoryDialog = () => {
    window.electron.selectDirectory().then((selectedDirectory) => {
      if (selectedDirectory) {
        const directoryPath = selectedDirectory[0];
        setDirectory({ path: directoryPath });
        localStorage.setItem('directory', directoryPath);
      }
    });
  };

  const runPythonScript = async () => {
    if (!directory) {
      toast({
        title: 'No Directory Selected',
        description: 'Please select a directory for future saved files.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const clientsJson = JSON.stringify(clients);
    const selectedPricesJson = JSON.stringify(selectedPrices);
    const invoiceDetailsJson = JSON.stringify(invoiceDetails);
    const taxRatesJson = JSON.stringify(taxRates[0]);

    // Run Python script and wait for response
    const result = await window.electron.runPythonScript(
      'createConfirmationDocuments',
      [
        directory.path,
        clientsJson,
        selectedPricesJson,
        invoiceDetailsJson,
        taxRatesJson,
        includeTaxes,
        language,
      ],
    );

    console.log('Python script result:', result);

    await supabase
      .from('invoice_number')
      .update({ invoices: invoiceDetails.invoiceNumber + 1 })
      .eq('id', 1);

    setInvoiceDetails((prevDetails) => ({
      ...prevDetails,
      invoiceNumber: prevDetails.invoiceNumber + 1,
    }));

    toast({
      title: 'Success',
      description: 'Invoice and email created successfully!',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };

  // Set up a listener to handle the result of the script
  window.electron.onPythonResult((result) => {
    if (!result.success) {
      toast({
        title: 'Error',
        description: result.error || 'An Error has Occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  });

  const resetAll = () => {
    const currentInvoiceNumber = invoiceDetails.invoiceNumber;

    setClients([
      {
        title: '',
        name: '',
        years: [
          {
            year: '',
            confirmationNumbers: {
              federal: '',
              quebec: '',
            },
          },
        ],
      },
    ]);
    setSelectedPrices([]);
    setInvoiceDetails({
      companyName: '',
      fullName: '',
      address: '',
      email: '',
      phoneNumber: '',
      notes: 'To be paid upon reception',
      invoiceNumber: currentInvoiceNumber,
    });
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      overflowY="auto"
      position="relative"
      fontFamily="Inter"
    >
      <NavBar />
      <Box
        width="100%"
        height="calc(100vh - 125px)"
        textAlign="center"
        overflowY="auto"
        display="flex"
        flexDirection="column"
        padding="20px"
      >
        <HStack gap="15px">
          {' '}
          <VStack width="50%">
            <Box
              display="flex"
              width="100%"
              alignItems="center"
              p="20px"
              height="50px"
            >
              <Text fontSize="18px" fontWeight="bold" mr="10px">
                Save Directory:
              </Text>
              <Box
                display="flex"
                alignItems="center"
                border="3px solid #cf3350"
                borderRadius="md"
                cursor="pointer"
                onClick={openDirectoryDialog}
                flex="1"
                _hover={{ background: '#f1f1f1' }}
              >
                <FaFolderOpen
                  size={24}
                  color="#cf3350"
                  style={{ marginRight: '10px', marginLeft: '10px' }}
                />
                <Input
                  placeholder="Select the directory you would like to save the files in"
                  value={directory?.path || ''}
                  isReadOnly
                  flex="1"
                  border="none"
                  cursor="pointer"
                />
              </Box>
              <Button
                ml="10px"
                bg="#909090"
                color="white"
                _hover={{ opacity: '0.6' }}
                onClick={() => resetAll()}
              >
                Reset All
              </Button>
            </Box>
            <Box
              bg="#f1f1f1"
              padding="20px"
              borderRadius="10px"
              width="100%"
              height="50vh"
              boxShadow="4px 8px 16px rgba(0, 0, 0, 0.1), 2px 4px 6px rgba(0, 0, 0, 0.05)"
              border="1px solid #e0e0e0"
            >
              <Box
                justifyContent={'space-between'}
                display="flex"
                alignItems="center"
                mb={4}
              >
                {' '}
                <Heading size="sm">Confirmation Details</Heading>
                <HStack>
                  <Select
                    width="200px"
                    border="none"
                    borderRadius="0px"
                    color="#cf3350"
                    fontWeight="bold"
                    fontSize="14px"
                    borderBottom="2px solid #cf3350"
                    _focus={{
                      borderBottom: '3px solid #cf3350',
                      boxShadow: 'none',
                    }}
                    _hover={{
                      borderBottom: '3px solid #cf3350',
                    }}
                    _placeholder={{
                      color: '#cf3350',
                      opacity: '0.6',
                      fontSize: '12px',
                    }}
                    placeholder="Select Province"
                    width="100px"
                    onChange={(e) => {
                      const newProvince = e.target.value;
                      setSelectedProvince(newProvince);

                      clients.forEach((client, index) => {
                        client.years.forEach((yearItem, yearIndex) => {
                          if (client.province === 'QC') {
                            handleConfirmationNumberChange(
                              index,
                              yearIndex,
                              'quebec',
                              '',
                            );
                          }
                        });
                      });
                    }}
                    value={selectedProvince}
                  >
                    {provinces.map((province) => (
                      <option key={province.code} value={province.code}>
                        {province.province}
                      </option>
                    ))}
                  </Select>
                  <Select
                    border="none"
                    borderRadius="0px"
                    color="#cf3350"
                    fontWeight="bold"
                    fontSize="14px"
                    borderBottom="2px solid #cf3350"
                    _focus={{
                      borderBottom: '3px solid #cf3350',
                      boxShadow: 'none',
                    }}
                    _hover={{
                      borderBottom: '3px solid #cf3350',
                    }}
                    _placeholder={{
                      color: '#cf3350',
                      opacity: '0.6',
                      fontSize: '12px',
                    }}
                    placeholder="Select Language"
                    onChange={(e) => setLanguage(e.target.value)}
                    value={language}
                    width="100px"
                  >
                    <option value="en">EN</option>
                    <option value="fr">FR</option>
                  </Select>
                  <IconButton
                    aria-label="Add Client"
                    onClick={addClient}
                    fontSize="18px"
                    borderRadius="25px"
                    icon={<MdAdd color="#cf3350" size="25px" />}
                  />
                </HStack>
              </Box>
              <Box overflowY="auto" height="calc(100% - 50px)">
                <ClientDetails
                  clients={clients}
                  handleClientChange={handleClientChange}
                  handleConfirmationNumberChange={
                    handleConfirmationNumberChange
                  }
                  addYear={addYear}
                  selectedProvince={selectedProvince}
                  removeClient={removeClient}
                  removeYear={removeYear}
                  onDragEnd={onDragEnd}
                />
              </Box>
            </Box>
          </VStack>
          <Box
            bg="#f1f1f1"
            padding="20px"
            borderRadius="10px"
            width="50%"
            height="calc(50vh + 60px)"
            boxShadow="4px 8px 16px rgba(0, 0, 0, 0.1), 2px 4px 6px rgba(0, 0, 0, 0.05)"
            border="1px solid #e0e0e0"
          >
            <Box
              display="flex"
              alignItems="center"
              mb={4}
              justifyContent="space-between"
            >
              <Heading size="sm">Price Details</Heading>{' '}
              <Checkbox
                isChecked={includeTaxes}
                onChange={(e) => setIncludeTaxes(e.target.checked)}
                color="#cf3350"
                fontWeight="bold"
                colorScheme="red"
              >
                Include Taxes
              </Checkbox>
            </Box>
            <Box overflowY="auto" height="50vh">
              <PriceSelection
                prices={prices}
                selectedPrices={selectedPrices}
                setSelectedPrices={setSelectedPrices}
                language={language}
                taxRates={taxRates}
                includeTaxes={includeTaxes}
              />
            </Box>
          </Box>
        </HStack>
        <Box
          bg="#f1f1f1"
          padding="20px"
          borderRadius="10px"
          width="100%"
          mt="15px"
          boxShadow="4px 8px 16px rgba(0, 0, 0, 0.1), 2px 4px 6px rgba(0, 0, 0, 0.05)"
          border="1px solid #e0e0e0"
        >
          {' '}
          <Box justifyContent="center">
            <Box
              alignItems="center"
              justifyContent={'space-between'}
              display="flex"
            >
              <Heading size="sm">Invoice Details</Heading>
              <Button
                p={4}
                onClick={runPythonScript}
                bg="#cf3350"
                color="white"
                fontSize="16px"
                width="fit-content"
                _hover={{ opacity: '0.5' }}
              >
                Confirm & Generate Documents
              </Button>{' '}
            </Box>
            <InvoiceDetails
              invoiceDetails={invoiceDetails}
              setInvoiceDetails={setInvoiceDetails}
            />
          </Box>
        </Box>
      </Box>{' '}
      <Button
        position="absolute"
        right="0px"
        top="40px"
        whiteSpace="nowrap"
        onClick={() => setIsSidebarOpen(true)}
        _hover={{ opacity: '0.6' }}
        bg="#cf3350"
        color="white"
        fontSize="18px"
        padding="25px"
        borderLeftRadius="20px"
      >
        Configuration
      </Button>
      <ConfigurationSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
    </Box>
  );
}

export default ConfirmationComponent;
