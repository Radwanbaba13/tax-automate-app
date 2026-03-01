import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormLabel,
  HStack,
  Switch,
  Text,
  VStack,
} from '@chakra-ui/react';
import { showToast } from '../../Utils/toast';
import { FaFolderOpen, FaUsers } from 'react-icons/fa';
import { MdAttachMoney, MdReceipt, MdCheckCircle } from 'react-icons/md';
import ClientDetails from './ClientDetails';
import InvoiceDetails from './InvoiceDetails';
import PriceSelection from './PriceSelection';
import SectionCard from '../common/SectionCard';
import FormSelect from '../common/FormSelect';
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
          showToast({
            title: 'Error fetching provinces',
            description: 'Could not fetch provinces. Please try again later.',
            status: 'error',
          });
          return;
        }

        if (data) {
          setProvinces(data);
        }
      } catch (err) {
        console.error('Unexpected error fetching provinces:', err);
        showToast({
          title: 'Error fetching provinces',
          description: 'Could not fetch provinces. Please try again later.',
          status: 'error',
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
        showToast({
          title: 'Error fetching prices',
          description: 'Could not fetch prices. Please try again later.',
          status: 'error',
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
        showToast({
          title: 'Error fetching invoice number',
          description:
            'Could not fetch the invoice number. Please try again later.',
          status: 'error',
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
        const { data, error } = await api.taxRates.getByProvince(province);

        if (error) throw error;
        // Ensure taxRates is always an array
        setTaxRates(data ? [data] : []);
      } catch {
        showToast({
          title: 'Error fetching tax rates',
          description: 'Could not fetch tax rates. Please try again later.',
          status: 'error',
        });
        setTaxRates([]);
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
      showToast({
        title: 'No directory selected',
        description: 'Please select a directory for future saved files.',
        status: 'warning',
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

    showToast({
      title: 'Documents generated',
      description: 'Invoice and email created successfully.',
      status: 'success',
    });
  };

  // Set up a listener to handle the result of the script
  React.useEffect(() => {
    window.electron.onPythonResult((result) => {
      if (!result.success) {
        showToast({
          title: 'Generation failed',
          description: result.error || 'An error has occurred.',
          status: 'error',
        });
      }
    });
  }, []);

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
    <VStack spacing={4} align="stretch" w="100%">
      {/* Save Directory Bar */}
      <Box
        bg="white"
        borderRadius="12px"
        border="1px solid #edf2f7"
        boxShadow="0 1px 3px rgba(0,0,0,0.04)"
        px={4}
        py="10px"
        display="flex"
        alignItems="center"
        gap={3}
      >
        <HStack
          flex="1"
          border="1.5px solid #e2e8f0"
          borderRadius="8px"
          cursor="pointer"
          onClick={openDirectoryDialog}
          px={3}
          py="10px"
          spacing={2}
          _hover={{ borderColor: '#cf3350', bg: '#fff8f9' }}
          transition="all 0.15s"
        >
          <FaFolderOpen size={15} color="#cf3350" style={{ flexShrink: 0 }} />
          <Text
            fontSize="13px"
            color={directory ? 'gray.700' : 'gray.400'}
            noOfLines={1}
            flex="1"
          >
            {directory?.path ||
              'Click to select a directory to save files in...'}
          </Text>
        </HStack>
        <Button
          size="md"
          variant="outline"
          colorScheme="gray"
          fontWeight="600"
          onClick={resetAll}
          flexShrink={0}
        >
          Reset All
        </Button>
      </Box>

      {/* Top Row */}
      <HStack gap={4} align="stretch" w="100%">
        {/* Confirmation Details */}
        <SectionCard
          flex="0 0 58%"
          height="52vh"
          title="Confirmation Details"
          subtitle={`${clients.length} client${clients.length !== 1 ? 's' : ''} added`}
          icon={<FaUsers size={18} />}
          actions={
            <HStack spacing={1}>
              <FormSelect
                width="95px"
                placeholder="Province"
                onChange={(e) => {
                  const newProvince = e.target.value;
                  setSelectedProvince(newProvince);
                  clients.forEach((client, index) => {
                    client.years.forEach((_yearItem, yearIndex) => {
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
              </FormSelect>
              <FormSelect
                width="80px"
                placeholder="Lang"
                onChange={(e) => setLanguage(e.target.value)}
                value={language}
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
              </FormSelect>
            </HStack>
          }
          contentProps={{ overflowY: 'auto', p: 4 }}
        >
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
          <Button
            w="100%"
            bg="#fcf7f7"
            color="#cf3350"
            fontWeight="500"
            fontSize="14px"
            borderRadius="8px"
            border="1px solid #cf3350"
            _hover={{ bg: '#fff0f3', border: '1px solid #cf3350' }}
            onClick={addClient}
          >
            + Add Another Client
          </Button>
        </SectionCard>

        {/* Price Details */}
        <SectionCard
          flex={1}
          height="52vh"
          title="Price Details"
          icon={<MdAttachMoney size={20} />}
          actions={
            <FormLabel
              htmlFor="include-taxes"
              display="flex"
              alignItems="center"
              gap={2}
              mb={0}
              cursor="pointer"
              fontSize="sm"
              color="gray.600"
              fontWeight="600"
            >
              <Switch
                id="include-taxes"
                isChecked={includeTaxes}
                onChange={(e) => setIncludeTaxes(e.target.checked)}
                colorScheme="red"
                size="sm"
              />
              Taxes
            </FormLabel>
          }
          contentProps={{ overflowY: 'auto', p: 4 }}
        >
          <PriceSelection
            prices={prices}
            selectedPrices={selectedPrices}
            setSelectedPrices={setSelectedPrices}
            language={language}
            taxRates={taxRates}
            includeTaxes={includeTaxes}
          />
        </SectionCard>
      </HStack>

      {/* Invoice Details */}
      <SectionCard
        w="100%"
        title="Invoice Details"
        subtitle="Client billing information"
        icon={<MdReceipt size={20} />}
        actions={
          <Button
            leftIcon={<MdCheckCircle />}
            onClick={runPythonScript}
            bg="#cf3350"
            color="white"
            fontSize="16px"
            size="sm"
            _hover={{ opacity: 0.8 }}
            borderRadius="8px"
            px={4}
          >
            Confirm &amp; Generate
          </Button>
        }
        contentProps={{ p: 5 }}
      >
        <InvoiceDetails
          invoiceDetails={invoiceDetails}
          setInvoiceDetails={setInvoiceDetails}
        />
      </SectionCard>
    </VStack>
  );
}

export default ConfirmationComponent;
