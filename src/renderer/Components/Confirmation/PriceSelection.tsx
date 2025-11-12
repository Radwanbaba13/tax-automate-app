import React, { useEffect, useState } from 'react';
import {
  Box,
  Text,
  Select,
  VStack,
  Input,
  HStack,
  useToast,
  IconButton,
} from '@chakra-ui/react';
import { MdAdd, MdClose, MdDragIndicator } from 'react-icons/md';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface PriceListItem {
  service: { en: string; fr: string };
  amount: number;
  type: string;
  quantity: number;
}

function PriceSelection({
  prices,
  selectedPrices,
  setSelectedPrices,
  language,
  taxRates,
  includeTaxes,
}) {
  const [customService, setCustomService] = useState({
    name: '',
    amount: '',
    type: 'number',
    quantity: 1,
  });
  const [selectedService, setSelectedService] = useState(null);
  const toast = useToast();
  const [totals, setTotals] = useState({
    subtotal: '',
    total: '',
    fedTax: '',
    provTax: '',
  });

  // Get tax rates for the selected province
  const getTaxRates = () => {
    const taxRate = taxRates[0];

    return taxRate
      ? { fedRate: taxRate.fedRate, provRate: taxRate.provRate }
      : { fedRate: 0, provRate: 0 };
  };

  // Calculate subtotal, total, and tax amounts
  const calculateTotals = () => {
    let subtotal = 0;
    const taxRates = getTaxRates();
    const { fedRate, provRate } = taxRates;

    selectedPrices.forEach((price) => {
      if (price.type === 'number') {
        subtotal += price.amount * price.quantity;
      } else if (price.type === '%') {
        subtotal += (price.amount / 100) * subtotal;
      }
    });

    if (!includeTaxes) {
      const total = subtotal.toFixed(2);
      return {
        subtotal: '0.00',
        total,
        fedRate,
        provRate,
      };
    }

    const total =
      fedRate + provRate > 0
        ? (subtotal * (1 + (fedRate + provRate) / 100)).toFixed(2)
        : subtotal.toFixed(2);

    return {
      subtotal: subtotal.toFixed(2),
      total,
      fedRate,
      provRate,
    };
  };

  // Handle adding a selected service to the selected prices
  const handleAddService = () => {
    if (selectedService) {
      const newService = {
        service: selectedService.service,
        amount: parseFloat(selectedService.amount),
        type: selectedService.type,
        quantity: 1,
      };

      setSelectedPrices([...selectedPrices, newService]);
      setSelectedService(null);
    } else if (customService.name && customService.amount) {
      const newService = {
        service: { en: customService.name, fr: customService.name },
        amount: parseFloat(customService.amount),
        type: customService.type,
        quantity: 1,
      };

      setSelectedPrices([...selectedPrices, newService]);
      setCustomService({ name: '', amount: '', type: 'amount', quantity: 1 });
    } else {
      toast({
        title: 'Invalid Input',
        description:
          'Please select a service or enter a custom service name and amount.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  const handlePriceRemove = (priceToRemove) => {
    setSelectedPrices(
      selectedPrices.filter((price) => price !== priceToRemove),
    );
  };

  const handleEditPrice = (index, field, value) => {
    const updatedPrices = [...selectedPrices];
    updatedPrices[index] = { ...updatedPrices[index], [field]: value };
    setSelectedPrices(updatedPrices);
  };

  // Handle drag end
  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(selectedPrices);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedPrices(items);
  };

  useEffect(() => {
    const { subtotal, total, fedRate, provRate } = calculateTotals();
    setTotals({ subtotal, total, fedRate, provRate });
  }, [includeTaxes, selectedPrices]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box>
        <HStack spacing={2} mb={'20px'}>
          <Select
            placeholder="Select Service to Add"
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                const selectedService = JSON.parse(value);
                const newService = {
                  service: selectedService.service,
                  amount: parseFloat(selectedService.amount),
                  type: selectedService.type,
                  quantity: 1,
                };
                setSelectedPrices([...selectedPrices, newService]);
                setSelectedService(null);
              } else {
                setSelectedService(null);
              }
            }}
            value={selectedService ? JSON.stringify(selectedService) : ''}
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
          >
            {prices.map((price, index) => (
              <option key={index} value={JSON.stringify(price)}>
                {language === 'en' ? price.service.en : price.service.fr}:{' '}
                {price.type === 'number' && '$'}
                {price.amount}
                {price.type === '%' && '%'}
              </option>
            ))}

            <option
              value={JSON.stringify({
                service: { en: 'Custom', fr: 'Personnalisé' },
                amount: 0,
                type: 'number',
                quantity: 1,
              })}
            >
              Custom Service
            </option>
          </Select>
        </HStack>

        <Droppable droppableId="droppable-prices">
          {(provided) => (
            <VStack
              spacing={4}
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {selectedPrices.map((price, index) => (
                <Draggable
                  key={index}
                  draggableId={`price-${index}`}
                  index={index}
                >
                  {(provided) => (
                    <HStack
                      justify="space-between"
                      w="100%"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <IconButton
                        {...provided.dragHandleProps}
                        aria-label="Drag Price"
                        icon={<MdDragIndicator color="#cf3350" size="20px" />}
                        variant="ghost"
                      />
                      <Input
                        placeholder="QTY"
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
                        type="number"
                        min="1"
                        value={price.quantity}
                        onChange={(e) =>
                          handleEditPrice(
                            index,
                            'quantity',
                            parseInt(e.target.value),
                          )
                        }
                        width="65px"
                      />
                      <Input
                        width="60%"
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
                        value={
                          language === 'en'
                            ? price.service.en
                            : price.service.fr
                        }
                        onChange={(e) =>
                          handleEditPrice(index, 'service', {
                            ...price.service,
                            [language === 'en' ? 'en' : 'fr']: e.target.value,
                          })
                        }
                      />
                      <Input
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
                        type="number"
                        value={price.amount}
                        onChange={(e) =>
                          handleEditPrice(
                            index,
                            'amount',
                            parseFloat(e.target.value),
                          )
                        }
                        width="100px"
                      />

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
                        value={price.type}
                        onChange={(e) =>
                          handleEditPrice(index, 'type', e.target.value)
                        }
                        width="100px"
                      >
                        <option value="number">$</option>
                        <option value="%">%</option>
                      </Select>

                      <IconButton
                        onClick={() => handlePriceRemove(price)}
                        aria-label="Remove Price"
                        borderRadius="25px"
                        icon={<MdClose color="#cf3350" size="20px" />}
                      />
                    </HStack>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </VStack>
          )}
        </Droppable>

        <Box mt={4} mr="40px" p={4}>
          {includeTaxes ? (
            <>
              <Text fontSize="16px" textAlign="right" color="#cf3350">
                Subtotal: ${totals.subtotal}
              </Text>
              {totals.fedRate > 0 && (
                <Text fontSize="14px" textAlign="right" color="gray.600">
                  Federal Tax ({totals.fedRate}%): $
                  {((totals.subtotal * totals.fedRate) / 100).toFixed(2)}
                </Text>
              )}
              {totals.provRate > 0 && (
                <Text fontSize="14px" textAlign="right" color="gray.600">
                  Provincial Tax ({totals.provRate}%): $
                  {((totals.subtotal * totals.provRate) / 100).toFixed(2)}
                </Text>
              )}{' '}
              <Text
                fontSize="18px"
                fontWeight="bold"
                textAlign="right"
                color="#cf3350"
              >
                Total: ${totals.total}
              </Text>
            </>
          ) : (
            <Text
              fontSize="18px"
              fontWeight="bold"
              textAlign="right"
              color="#cf3350"
            >
              Total: ${totals.total}
            </Text>
          )}
        </Box>
      </Box>
    </DragDropContext>
  );
}

export default PriceSelection;
