import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Input,
  Select,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { supabase } from '../../Utils/supabaseClient';

interface PriceListItem {
  service: { en: string; fr: string };
  amount: number;
  type: string;
}

function PriceListConfig() {
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [isModified, setIsModified] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: priceData } = await supabase
          .from('price_list')
          .select('*');
        const { data: taxData } = await supabase.from('tax_rates').select('*');
        setPriceList(priceData || []);
        setTaxRates(taxData || []);
      } catch {
        toast({
          title: 'Error fetching data',
          description: 'Could not fetch price list and tax rates.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchData();
  }, [toast]);

  const handleUpdatePriceList = (index: number, field: string, value: any) => {
    const updatedPriceList = [...priceList];
    updatedPriceList[index][field] = value;
    setPriceList(updatedPriceList);
    setIsModified(true);
  };

  const handleUpdateTaxRate = (index: number, field: string, value: any) => {
    const updatedTaxRates = [...taxRates];
    updatedTaxRates[index][field] = value;
    setTaxRates(updatedTaxRates);
    setIsModified(true);
  };

  const handleAddInput = (section: string) => {
    if (section === 'priceList') {
      setPriceList([
        ...priceList,
        { service: { en: '', fr: '' }, amount: 0, type: 'number' },
      ]);
    } else {
      setTaxRates([...taxRates, { province: '', fedRate: 0, provRate: 0 }]);
    }
  };

  const handleRemoveInput = (index: number, section: string) => {
    if (section === 'priceList') {
      const updatedPriceList = [...priceList];
      updatedPriceList.splice(index, 1);
      setPriceList(updatedPriceList);
    } else {
      const updatedTaxRates = [...taxRates];
      updatedTaxRates.splice(index, 1);
      setTaxRates(updatedTaxRates);
    }
    setIsModified(true);
  };

  const handleSave = async () => {
    try {
      // Step 1: Delete all existing entries from price_list
      const { error: deletePriceListError } = await supabase
        .from('price_list')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deletePriceListError) throw deletePriceListError;

      // Step 2: Insert updated price list
      const { error: insertPriceListError } = await supabase
        .from('price_list')
        .insert(
          priceList.map((item) => ({
            service: item.service,
            amount: item.amount,
            type: item.type,
          })),
        );

      if (insertPriceListError) throw insertPriceListError;

      // Step 3: Delete all existing entries from tax_rates
      const { error: deleteTaxRatesError } = await supabase
        .from('tax_rates')
        .delete()
        .neq('province', 0);

      if (deleteTaxRatesError) throw deleteTaxRatesError;

      // Step 4: Insert updated tax rates
      const { error: insertTaxRatesError } = await supabase
        .from('tax_rates')
        .insert(
          taxRates.map((rate) => ({
            province: rate.province, // Ensure this matches your schema
            fedRate: rate.fedRate,
            provRate: rate.provRate,
          })),
        );

      if (insertTaxRatesError) throw insertTaxRatesError;

      // If everything is successful
      setIsModified(false);
      toast({
        title: 'Success!',
        description: 'Changes saved successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Error!',
        description: `Failed to save changes: ${error?.message || 'Unknown error'}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4}>
      <Tabs variant="enclosed">
        <TabList>
          <Tab
            borderBottom="#cf3350 2px solid"
            fontWeight="bold"
            fontSize="14px"
            _selected={{
              color: '#cf3350',
              borderColor: '#cf3350',
              borderBottom: '0px',
            }}
          >
            Price List
          </Tab>
          <Tab
            borderBottom="#cf3350 2px solid"
            fontWeight="bold"
            fontSize="14px"
            _selected={{
              color: '#cf3350',
              borderColor: '#cf3350',
              borderBottom: '0px',
            }}
          >
            Tax Rates
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <VStack spacing={4}>
              <Box display="flex" width="80%" justifyContent="space-around">
                <Text
                  fontSize="14px"
                  fontWeight="bold"
                  color="#cf3350"
                  decoration="underline"
                >
                  English
                </Text>
                <Text
                  fontSize="14px"
                  fontWeight="bold"
                  color="#386498"
                  decoration="underline"
                  width="40%"
                >
                  French
                </Text>
                <Text
                  fontSize="14px"
                  fontWeight="bold"
                  color="#cf3350"
                  decoration="underline"
                >
                  Amount
                </Text>
                <Text
                  fontSize="14px"
                  fontWeight="bold"
                  color="#cf3350"
                  decoration="underline"
                >
                  Type
                </Text>
              </Box>
              {priceList.map((item, index) => (
                <Box
                  key={index}
                  display="flex"
                  justifyContent="space-between"
                  width="100%"
                  gap="1px"
                >
                  <Input
                    value={item.service.en}
                    onChange={(e) =>
                      handleUpdatePriceList(index, 'service', {
                        ...item.service,
                        en: e.target.value,
                      })
                    }
                    placeholder="Service (EN)"
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
                    width="33%"
                  />
                  <Input
                    value={item.service.fr}
                    onChange={(e) =>
                      handleUpdatePriceList(index, 'service', {
                        ...item.service,
                        fr: e.target.value,
                      })
                    }
                    placeholder="Service (FR)"
                    border="none"
                    borderRadius="0px"
                    color="#386498"
                    fontWeight="bold"
                    fontSize="14px"
                    borderBottom="2px solid #386498"
                    _focus={{
                      borderBottom: '3px solid #386498',
                      boxShadow: 'none',
                    }}
                    _hover={{
                      borderBottom: '3px solid #386498',
                    }}
                    _placeholder={{
                      color: '#386498',
                      opacity: '0.6',
                      fontSize: '12px',
                    }}
                    width="33%"
                  />
                  <Input
                    type="number"
                    value={item.amount}
                    onChange={(e) =>
                      handleUpdatePriceList(
                        index,
                        'amount',
                        parseFloat(e.target.value),
                      )
                    }
                    placeholder="Amount"
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
                    width="65px"
                    minWidth="65px"
                  />
                  <Select
                    value={item.type}
                    onChange={(e) =>
                      handleUpdatePriceList(index, 'type', e.target.value)
                    }
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
                    width="65px"
                    minWidth="65px"
                  >
                    <option value="%">%</option>
                    <option value="number">$</option>
                  </Select>
                  <IconButton
                    aria-label="Delete"
                    icon={<IoClose color="grey" size="25px" />}
                    variant="ghost"
                    borderRadius="25px"
                    onClick={() => handleRemoveInput(index, 'priceList')}
                  />
                </Box>
              ))}
              <Button
                aria-label="Add"
                leftIcon={<FaPlus color="#cf3350" />}
                variant="ghost"
                borderRadius="25px"
                onClick={() => handleAddInput('priceList')}
                fontWeight="bold"
                color="#cf3350"
              >
                Add New Row
              </Button>
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack spacing={4}>
              <Box
                display="flex"
                width="80%"
                mr="10%"
                justifyContent="space-around"
              >
                <Text
                  fontSize="14px"
                  fontWeight="bold"
                  color="#cf3350"
                  decoration="underline"
                >
                  Province
                </Text>
                <Text
                  fontSize="14px"
                  fontWeight="bold"
                  color="#cf3350"
                  decoration="underline"
                >
                  FED Rate
                </Text>
                <Text
                  fontSize="14px"
                  fontWeight="bold"
                  color="#386498"
                  decoration="underline"
                >
                  Prov Rate
                </Text>
              </Box>
              {taxRates.map((rate, index) => (
                <Box
                  key={index}
                  display="flex"
                  justifyContent="space-between"
                  width="100%"
                  gap="1px"
                >
                  <Input
                    value={rate.province}
                    onChange={(e) =>
                      handleUpdateTaxRate(index, 'province', e.target.value)
                    }
                    placeholder="Province "
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
                    width="30%"
                  />
                  <Input
                    type="number"
                    value={rate.fedRate}
                    onChange={(e) =>
                      handleUpdateTaxRate(
                        index,
                        'fedRate',
                        parseFloat(e.target.value),
                      )
                    }
                    placeholder="Federal Rate"
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
                    width="30%"
                  />
                  <Input
                    type="number"
                    value={rate.provRate}
                    onChange={(e) =>
                      handleUpdateTaxRate(
                        index,
                        'provRate',
                        parseFloat(e.target.value),
                      )
                    }
                    placeholder="Provincial Rate"
                    border="none"
                    borderRadius="0px"
                    color="#386498"
                    fontWeight="bold"
                    fontSize="14px"
                    borderBottom="2px solid #386498"
                    _focus={{
                      borderBottom: '3px solid #386498',
                      boxShadow: 'none',
                    }}
                    _hover={{
                      borderBottom: '3px solid #386498',
                    }}
                    _placeholder={{
                      color: '#386498',
                      opacity: '0.6',
                      fontSize: '12px',
                    }}
                    width="30%"
                  />
                  <IconButton
                    aria-label="Delete"
                    icon={<IoClose color="grey" size="25px" />}
                    variant="ghost"
                    borderRadius="25px"
                    onClick={() => handleRemoveInput(index, 'taxRates')}
                  />
                </Box>
              ))}
              <Button
                aria-label="Add"
                leftIcon={<FaPlus color="#cf3350" />}
                variant="ghost"
                borderRadius="25px"
                onClick={() => handleAddInput('taxRates')}
                fontWeight="bold"
                color="#cf3350"
              >
                Add New Row
              </Button>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Box mt="auto" display="flex" justifyContent="flex-end" p={4}>
        <Button
          bg="#cf3350"
          color="white"
          _hover={{ opacity: 0.5 }}
          onClick={handleSave}
          isDisabled={!isModified}
        >
          Save Changes
        </Button>
      </Box>
    </Box>
  );
}

export default PriceListConfig;
