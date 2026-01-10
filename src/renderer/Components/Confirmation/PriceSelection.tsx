import React, { useEffect, useState } from 'react';
import {
  Box,
  HStack,
  IconButton,
  Input,
  Select,
  Text,
  VStack,
} from '@chakra-ui/react';
import { MdClose, MdDragIndicator } from 'react-icons/md';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface PriceListItem {
  service: { en: string; fr: string };
  amount: number;
  type: string;
  quantity: number;
}

interface TaxRate {
  fedRate: number;
  provRate: number;
}

interface PriceSelectionProps {
  prices: PriceListItem[];
  selectedPrices: PriceListItem[];
  setSelectedPrices: (prices: PriceListItem[]) => void;
  language: string;
  taxRates: TaxRate[];
  includeTaxes: boolean;
}

function PriceSelection({
  prices,
  selectedPrices,
  setSelectedPrices,
  language,
  taxRates,
  includeTaxes,
}: PriceSelectionProps) {
  const [totals, setTotals] = useState({
    subtotal: '',
    total: '',
    fedRate: 0,
    provRate: 0,
  });

  // Get tax rates for the selected province
  const getTaxRates = () => {
    const taxRate = taxRates && taxRates.length > 0 ? taxRates[0] : null;

    return taxRate
      ? { fedRate: taxRate.fedRate || 0, provRate: taxRate.provRate || 0 }
      : { fedRate: 0, provRate: 0 };
  };

  // Calculate subtotal, total, and tax amounts
  const calculateTotals = () => {
    // First, calculate all fixed amounts (type === 'number')
    let subtotal = 0;
    const percentageAdjustments: number[] = [];

    selectedPrices.forEach((price) => {
      if (price.type === 'number') {
        subtotal += price.amount * price.quantity;
      } else if (price.type === '%') {
        percentageAdjustments.push(price.amount);
      }
    });

    // Apply percentage adjustments to the subtotal
    percentageAdjustments.forEach((percentage) => {
      subtotal += (subtotal * percentage) / 100;
    });

    const rates = getTaxRates();
    const { fedRate, provRate } = rates;

    // Calculate taxes only if includeTaxes is true
    if (includeTaxes) {
      const fedTax = (subtotal * fedRate) / 100;
      const provTax = (subtotal * provRate) / 100;
      const total = subtotal + fedTax + provTax;

      return {
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2),
        fedRate,
        provRate,
      };
    }

    // If taxes are not included, total equals subtotal
    return {
      subtotal: subtotal.toFixed(2),
      total: subtotal.toFixed(2),
      fedRate,
      provRate,
    };
  };

  const handlePriceRemove = (priceToRemove: PriceListItem) => {
    setSelectedPrices(
      selectedPrices.filter((price) => price !== priceToRemove),
    );
  };

  const handleEditPrice = (index: number, field: string, value: any) => {
    const updatedPrices = [...selectedPrices];
    updatedPrices[index] = { ...updatedPrices[index], [field]: value };
    setSelectedPrices(updatedPrices);
  };

  // Handle drag end
  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(selectedPrices);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedPrices(items);
  };

  useEffect(() => {
    const { subtotal, total, fedRate, provRate } = calculateTotals();
    setTotals({ subtotal, total, fedRate, provRate });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeTaxes, selectedPrices, taxRates]);

  const selectedProvince =
    taxRates && taxRates.length > 0 ? (taxRates[0] as any).province : undefined;
  const provRateLabel =
    selectedProvince === 'QC'
      ? Number(totals.provRate).toFixed(3)
      : Number(totals.provRate);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box>
        <HStack spacing={2} mb="20px">
          <Select
            placeholder="Select Service to Add"
            onChange={(e) => {
              const { value } = e.target;
              if (value) {
                const selectedService = JSON.parse(value);
                const newService = {
                  service: selectedService.service,
                  amount: parseFloat(selectedService.amount),
                  type: selectedService.type,
                  quantity: 1,
                };
                setSelectedPrices([...selectedPrices, newService]);
              }
            }}
            value=""
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
            {/* eslint-disable react/no-array-index-key */}
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

        <Droppable
          droppableId="droppable-prices"
          isDropDisabled={false}
          isCombineEnabled={false}
          ignoreContainerClipping={false}
        >
          {(droppableProvided) => (
            <VStack
              spacing={4}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...droppableProvided.droppableProps}
              ref={droppableProvided.innerRef}
            >
              {/* eslint-disable react/no-array-index-key */}
              {selectedPrices.map((price, index) => (
                <Draggable
                  key={`price-${index}`}
                  draggableId={`price-${index}`}
                  index={index}
                >
                  {(draggableProvided) => (
                    <HStack
                      justify="space-between"
                      w="100%"
                      ref={draggableProvided.innerRef}
                      // eslint-disable-next-line react/jsx-props-no-spreading
                      {...draggableProvided.draggableProps}
                    >
                      <IconButton
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        {...draggableProvided.dragHandleProps}
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
                            parseInt(e.target.value, 10),
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
                            ? price.service?.en || ''
                            : price.service?.fr || ''
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
                        background="transparent"
                        _hover={{ background: '#dfdfdfff' }}
                        icon={<MdClose color="#cf3350" size="20px" />}
                      />
                    </HStack>
                  )}
                </Draggable>
              ))}
              {droppableProvided.placeholder}
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
                  {(
                    (parseFloat(totals.subtotal) * totals.fedRate) /
                    100
                  ).toFixed(2)}
                </Text>
              )}
              {totals.provRate > 0 && (
                <Text fontSize="14px" textAlign="right" color="gray.600">
                  Provincial Tax ({provRateLabel}%): $
                  {(
                    (parseFloat(totals.subtotal) * totals.provRate) /
                    100
                  ).toFixed(2)}
                </Text>
              )}
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
