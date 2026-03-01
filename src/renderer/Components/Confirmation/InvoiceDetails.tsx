import React from 'react';
import { HStack, Text, Textarea } from '@chakra-ui/react';
import FormInput from '../common/FormInput';

interface InvoiceDetailsData {
  companyName: string;
  fullName: string;
  email: string;
  address: string;
  phoneNumber: string;
  notes: string;
}

interface InvoiceDetailsProps {
  invoiceDetails: InvoiceDetailsData;
  setInvoiceDetails: (details: InvoiceDetailsData) => void;
}

function InvoiceDetails({
  invoiceDetails,
  setInvoiceDetails,
}: InvoiceDetailsProps) {
  return (
    <>
      <HStack spacing={4} mt="15px" justifyContent="space-between" width="100%">
        <Text fontSize="14px" fontWeight="bold" color="#cf3350" ml="5%">
          Company Name
        </Text>
        <Text fontSize="14px" color="#cf3350" fontWeight="bold">
          Full Name*
        </Text>
        <Text fontSize="14px" color="#cf3350" fontWeight="bold">
          Email
        </Text>
        <Text fontSize="14px" color="#cf3350" fontWeight="bold">
          Address
        </Text>
        <Text fontSize="14px" color="#cf3350" fontWeight="bold" mr="7%">
          Phone Number
        </Text>
      </HStack>
      <HStack spacing={4} mb={4}>
        <FormInput
          placeholder="Company Name"
          value={invoiceDetails.companyName}
          onChange={(e) =>
            setInvoiceDetails({
              ...invoiceDetails,
              companyName: e.target.value,
            })
          }
        />
        <FormInput
          placeholder="Full Name"
          value={invoiceDetails.fullName}
          onChange={(e) =>
            setInvoiceDetails({ ...invoiceDetails, fullName: e.target.value })
          }
        />
        <FormInput
          placeholder="Email"
          value={invoiceDetails.email}
          onChange={(e) =>
            setInvoiceDetails({
              ...invoiceDetails,
              email: e.target.value,
            })
          }
        />
        <FormInput
          placeholder="Address"
          value={invoiceDetails.address}
          onChange={(e) =>
            setInvoiceDetails({ ...invoiceDetails, address: e.target.value })
          }
        />
        <FormInput
          placeholder="Phone Number"
          value={invoiceDetails.phoneNumber}
          onChange={(e) =>
            setInvoiceDetails({
              ...invoiceDetails,
              phoneNumber: e.target.value,
            })
          }
        />
      </HStack>
      <Text fontSize="14px" fontWeight="bold" color="#cf3350" textAlign="left">
        Notes / Terms
      </Text>
      <Textarea
        mt="10px"
        borderRadius="15px"
        color="#cf3350"
        fontWeight="bold"
        fontSize="14px"
        border="2px solid #cf3350"
        _focus={{
          border: '2px solid #cf3350',
          boxShadow: 'none',
        }}
        _hover={{
          border: '2px solid #cf3350',
        }}
        _placeholder={{
          color: '#cf3350',
          opacity: '0.6',
          fontSize: '12px',
        }}
        placeholder="Notes"
        value={invoiceDetails.notes}
        onChange={(e) =>
          setInvoiceDetails({
            ...invoiceDetails,
            notes: e.target.value,
          })
        }
      />
    </>
  );
}

export default InvoiceDetails;
