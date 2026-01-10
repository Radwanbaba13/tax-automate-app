import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Heading,
  HStack,
  IconButton,
  Input,
  Select,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { FaFolderOpen } from 'react-icons/fa';
import { MdAdd } from 'react-icons/md';
import ClientDetails from './ClientDetails';
import InvoiceDetails from './InvoiceDetails';
import PriceSelection from './PriceSelection';
import { api } from '../../Utils/apiClient';

interface PriceListItem {
  service: { en: string; fr: string };
  amount: number;
  type: string;
  quantity: number;
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
      const translatedTitle = (title: string, lang: string) => {
        if (lang === 'fr') {
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

      const title = clients[0].title || '';
      const finalTitle = translatedTitle(title, language);

      const fullName = `${finalTitle} ${clients[0].name}`.trim();
      const name = clients[0].name || '';
      setInvoiceDetails((prev) => ({ ...prev, fullName, name }));
    }
  }, [clients[0]?.title, clients[0]?.name, language]);

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
        const { data, error } = await api.taxRates.getAll();

        if (error) {
          console.error('Error fetching provinces:', error);
          toast({
            title: 'Error Fetching Provinces',
            description: 'Could not fetch provinces. Please try again later.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        if (data) {
          setProvinces(data);
        }
      } catch (err) {
        console.error('Unexpected error fetching provinces:', err);
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
        const { data, error } = await api.priceList.getAll();
        if (error) throw error;

        // Parse service field from JSON strings if needed
        const parsedPrices = (data || []).map((item: any) => {
          let service = { en: '', fr: '' };

          if (item.service) {
            if (typeof item.service === 'string') {
              try {
                service = JSON.parse(item.service);
              } catch {
                service = { en: '', fr: '' };
              }
            } else if (typeof item.service === 'object') {
              service = {
                en: item.service.en || '',
                fr: item.service.fr || '',
              };
            }
          }

          return {
            ...item,
            service,
          };
        });

        setPrices(parsedPrices);
      } catch {
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
        const { data, error } = await api.invoiceNumber.get();

        if (error) throw error;
        setInvoiceDetails((prevDetails) => ({
          ...prevDetails,
          invoiceNumber: data.invoices || 1111,
        }));
      } catch {
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
  }, [toast]);

  useEffect(() => {
    const fetchTaxRates = async (province) => {
      try {
        const { data, error } = await api.taxRates.getByProvince(province);

        if (error) throw error;
        // Ensure taxRates is always an array
        setTaxRates(data ? [data] : []);
      } catch {
        toast({
          title: 'Error Fetching Tax Rates',
          description: 'Could not fetch tax rates. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setTaxRates([]);
      }
    };

    fetchTaxRates(selectedProvince);
  }, [selectedProvince, toast]);

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
        } else if (
          client.years.length < prevClients[clientIndex].years.length
        ) {
          const newYear = {
            year: '',
            confirmationNumbers: {
              federal: '',
              quebec: '',
            },
          };
          updatedClient.years = [...updatedClient.years, newYear];
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
  const handleClientChange = React.useCallback(
    (clientIndex, field, yearIndex, yearField, value) => {
      setClients((prevClients) => {
        const updatedClients = [...prevClients];
        const client = { ...updatedClients[clientIndex] };

        if (field === 'years' && yearIndex !== null && yearField !== null) {
          const updatedYears = [...client.years];
          updatedYears[yearIndex] = {
            ...updatedYears[yearIndex],
            [yearField]: value,
          };
          client.years = updatedYears;
        } else {
          client[field] = value;
        }

        updatedClients[clientIndex] = client;
        return updatedClients;
      });
    },
    [],
  );

  const handleConfirmationNumberChange = React.useCallback(
    (clientIndex, yearIndex, type, value) => {
      setClients((prevClients) => {
        const updatedClients = [...prevClients];

        // Ensure the specific year exists and update the confirmation number
        if (updatedClients[clientIndex]?.years[yearIndex]) {
          const client = { ...updatedClients[clientIndex] };
          const years = [...client.years];
          years[yearIndex] = {
            ...years[yearIndex],
            confirmationNumbers: {
              ...years[yearIndex].confirmationNumbers,
              [type]: value,
            },
          };
          client.years = years;
          updatedClients[clientIndex] = client;
        }

        return updatedClients;
      });
    },
    [],
  );
  const removeClient = (index) => {
    setClients((prevClients) => prevClients.filter((_, i) => i !== index));
  };

  const openDirectoryDialog = () => {
    window.electron
      .selectDirectory()
      .then((selectedDirectory) => {
        if (selectedDirectory) {
          const directoryPath = selectedDirectory[0];
          setDirectory({ path: directoryPath });
          localStorage.setItem('directory', directoryPath);
        }
        return undefined;
      })
      .catch(() => {
        // Handle directory selection errors silently
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
    await window.electron.runPythonScript('createConfirmationDocuments', [
      directory.path,
      clientsJson,
      selectedPricesJson,
      invoiceDetailsJson,
      taxRatesJson,
      includeTaxes,
      language,
    ]);

    await api.invoiceNumber.update(invoiceDetails.invoiceNumber + 1);

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
  React.useEffect(() => {
    window.electron.onPythonResult((result) => {
      if (!result.success) {
        const errorMessage = result.error || 'An Error has Occurred.';
        const formattedError = `Internal Python Error: ${errorMessage}`;

        toast({
          title: 'Error',
          description: formattedError,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    });
  }, [toast]);

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
      name: '',
      address: '',
      email: '',
      phoneNumber: '',
      notes: 'To be paid upon reception',
      invoiceNumber: currentInvoiceNumber,
    });
  };

  return (
    <VStack spacing={6} align="stretch" w="100%">
      <HStack gap="15px" align="flex-start" w="100%">
        <VStack flex={1} spacing={4} align="stretch" w="100%">
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
              border="2px solid #cf3350"
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
              onClick={resetAll}
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
              justifyContent="space-between"
              display="flex"
              alignItems="center"
              mb={4}
            >
              {' '}
              <Heading size="sm">Confirmation Details</Heading>
              <HStack>
                <Select
                  width="100px"
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
                  {provinces.map((prov: any) => (
                    <option key={prov.province} value={prov.province}>
                      {prov.province}
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
                  background="transparent"
                  _hover={{ background: '#dfdfdfff' }}
                  icon={<MdAdd color="#cf3350" size="25px" />}
                />
              </HStack>
            </Box>
            <Box overflowY="auto" height="calc(100% - 50px)">
              <ClientDetails
                clients={clients}
                /* eslint-disable-next-line react/jsx-no-bind */
                handleClientChange={handleClientChange}
                handleConfirmationNumberChange={handleConfirmationNumberChange}
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
          flex={1}
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
        w="100%"
        mt="15px"
        boxShadow="4px 8px 16px rgba(0, 0, 0, 0.1), 2px 4px 6px rgba(0, 0, 0, 0.05)"
        border="1px solid #e0e0e0"
      >
        {' '}
        <Box justifyContent="center">
          <Box
            alignItems="center"
            justifyContent="space-between"
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
    </VStack>
  );
}

export default ConfirmationComponent;
