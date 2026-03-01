import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  HStack,
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
} from '@chakra-ui/react';
import { showToast } from '../../Utils/toast';
import { FaPlus } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { MdDragHandle } from 'react-icons/md';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { api } from '../../Utils/apiClient';

interface PriceListItem {
  service: { en: string; fr: string };
  amount: number;
  type: string;
}

function PriceListConfig() {
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: priceData } = await api.priceList.getAll();
        const { data: taxData } = await api.taxRates.getAll();

        // Parse service field from JSON strings if needed
        const parsedPriceData = (priceData || []).map((item: any) => {
          let service = { en: '', fr: '' };

          if (item.service) {
            if (typeof item.service === 'string') {
              try {
                service = JSON.parse(item.service);
              } catch {
                // If parsing fails, try to use as-is or set defaults
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

        setPriceList(parsedPriceData);
        setTaxRates(taxData || []);
      } catch {
        showToast({
          title: 'Error fetching data',
          description: 'Could not fetch price list and tax rates.',
          status: 'error',
        });
      }
    };

    fetchData();
  }, []);

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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const updatedPriceList = [...priceList];
    const [removed] = updatedPriceList.splice(source.index, 1);
    updatedPriceList.splice(destination.index, 0, removed);

    setPriceList(updatedPriceList);
    setIsModified(true);
  };

  const handleSave = async () => {
    try {
      // Filter out empty/invalid prices before saving
      const validPrices = priceList
        .filter(
          (item) =>
            item.service &&
            item.service.en?.trim() &&
            item.service.fr?.trim() &&
            !isNaN(item.amount) &&
            item.type &&
            (item.type === 'number' || item.type === '%'),
        )
        .map((item) => ({
          service: {
            en: item.service.en.trim(),
            fr: item.service.fr.trim(),
          },
          amount: Number(item.amount),
          type: item.type,
        }));

      if (validPrices.length === 0 && priceList.length > 0) {
        showToast({
          title: 'Validation error',
          description:
            'Please fill in all fields (English service, French service, amount, and type) for at least one item.',
          status: 'error',
        });
        return;
      }

      // Bulk replace price list (only valid ones)
      const priceListResult = await api.priceList.bulkReplace(validPrices);

      if (priceListResult.error) {
        throw new Error(
          priceListResult.error?.message || 'Failed to save price list',
        );
      }

      // Filter out empty/invalid tax rates before saving and normalize provinces
      const validTaxRates = taxRates
        .filter(
          (rate) =>
            rate.province &&
            rate.province.trim() !== '' &&
            !isNaN(rate.fedRate) &&
            !isNaN(rate.provRate),
        )
        .map((rate) => ({
          province: rate.province.trim().toUpperCase(),
          fedRate: Number(rate.fedRate),
          provRate: Number(rate.provRate),
        }));

      // Check for duplicate provinces in valid rates (case-insensitive)
      const provinceCodes = validTaxRates.map((rate) => rate.province);
      const seenProvinces = new Set<string>();
      const duplicateProvinces: string[] = [];

      provinceCodes.forEach((code) => {
        if (seenProvinces.has(code)) {
          duplicateProvinces.push(code);
        } else {
          seenProvinces.add(code);
        }
      });

      if (duplicateProvinces.length > 0) {
        showToast({
          title: 'Duplicate province codes',
          description: `Duplicate province codes found: ${duplicateProvinces.join(', ')}. Each province must be unique.`,
          status: 'error',
        });
        return;
      }

      // Remove duplicates (keep first occurrence)
      const uniqueTaxRates = validTaxRates.filter((rate, index, self) => {
        return (
          index ===
          self.findIndex(
            (r) => r.province.toUpperCase() === rate.province.toUpperCase(),
          )
        );
      });

      // Bulk replace tax rates (only valid, unique ones)
      const taxRatesResult = await api.taxRates.bulkReplace(uniqueTaxRates);

      if (taxRatesResult.error) {
        throw new Error(
          taxRatesResult.error?.message || 'Failed to save tax rates',
        );
      }

      // If everything is successful
      setIsModified(false);
      showToast({
        title: 'Changes saved',
        description: 'Price list and tax rates updated successfully.',
        status: 'success',
      });
    } catch (error: any) {
      console.error('Save error:', error);
      showToast({
        title: 'Error saving changes',
        description: `Failed to save changes: ${
          error?.message || error?.toString() || 'Unknown error'
        }`,
        status: 'error',
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
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="priceListSection">
                {(provided) => (
                  <VStack
                    spacing={4}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <Box
                      display="flex"
                      width="80%"
                      justifyContent="space-around"
                    >
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
                      <Draggable
                        key={`price-${index}`}
                        draggableId={`price-${index}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <HStack
                            spacing={2}
                            width="100%"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            bg={snapshot.isDragging ? '#f0f0f0' : 'transparent'}
                          >
                            <Box
                              cursor="grab"
                              _hover={{ color: '#cf3350' }}
                              {...provided.dragHandleProps}
                            >
                              <MdDragHandle size="25px" />
                            </Box>
                            <Input
                              value={item.service?.en || ''}
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
                              value={item.service?.fr || ''}
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
                                handleUpdatePriceList(
                                  index,
                                  'type',
                                  e.target.value,
                                )
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
                              onClick={() =>
                                handleRemoveInput(index, 'priceList')
                              }
                            />
                          </HStack>
                        )}
                      </Draggable>
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
                    {provided.placeholder}
                  </VStack>
                )}
              </Droppable>
            </DragDropContext>
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
