import React from 'react';
import {
  VStack,
  HStack,
  Box,
  Text,
  Spinner,
  Icon,
} from '@chakra-ui/react';
import { FiFileText } from 'react-icons/fi';
import { MdAnalytics } from 'react-icons/md';
import SectionCard from '../../common/SectionCard';

interface Metrics {
  cost: number;
  timeMinutes: number;
  timeSeconds: number;
}

interface DebugInfo {
  model: string;
  dtMaxImagesCount: number;
  clientSlipsImagesCount: number;
  totalContentItems: number;
  inputTokens: number;
  outputTokens: number;
}

interface ResultsPanelProps {
  isComparing: boolean;
  comparisonResult: string;
  metrics: Metrics | null;
  debugInfo: DebugInfo | null;
}

interface DebugInfoPanelProps {
  debugInfo: DebugInfo;
  cost: number;
}

function DebugInfoPanel({ debugInfo, cost }: DebugInfoPanelProps) {
  return (
    <Box
      bg="gray.800"
      p={4}
      borderRadius="md"
      border="2px solid"
      borderColor="gray.600"
    >
      <VStack spacing={3} align="stretch">
        <HStack justify="space-between" align="center">
          <Text color="gray.300" fontSize="sm" fontWeight="bold">
            DEBUG INFO
          </Text>
          <HStack spacing={1}>
            <Text color="gray.400" fontSize="lg" fontWeight="bold">
              COST:
            </Text>
            <Text
              color="green.300"
              fontSize="2xl"
              fontWeight="black"
              fontFamily="monospace"
            >
              ${cost.toFixed(4)}
            </Text>
          </HStack>
        </HStack>
        <Box h="1px" bg="gray.700" />
        <HStack spacing={4} wrap="wrap">
          <Text color="green.300" fontSize="xs" fontFamily="monospace">
            Model: {debugInfo.model}
          </Text>
          <Text color="blue.300" fontSize="xs" fontFamily="monospace">
            DT Max: {debugInfo.dtMaxImagesCount} imgs
          </Text>
          <Text color="blue.300" fontSize="xs" fontFamily="monospace">
            Client Slips: {debugInfo.clientSlipsImagesCount} imgs
          </Text>
        </HStack>
        <HStack spacing={4} wrap="wrap">
          <Text color="yellow.300" fontSize="xs" fontFamily="monospace">
            Content Items: {debugInfo.totalContentItems}
          </Text>
          <Text color="purple.300" fontSize="xs" fontFamily="monospace">
            Tokens: {debugInfo.inputTokens} in / {debugInfo.outputTokens} out
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
}

function ResultsPanel({
  isComparing,
  comparisonResult,
  metrics,
  debugInfo,
}: ResultsPanelProps) {
  return (
    <SectionCard
      flex="1"
      overflow="hidden"
      icon={<MdAnalytics size={16} />}
      title="Comparison Results"
      actions={
        metrics && !isComparing ? (
          <HStack spacing={4} fontSize="sm" color="gray.600">
            <HStack spacing={1}>
              <Text fontWeight="600">Cost:</Text>
              <Text color="green.600" fontWeight="700">
                ${metrics.cost.toFixed(4)}
              </Text>
            </HStack>
            <HStack spacing={1}>
              <Text fontWeight="600">Time:</Text>
              <Text color="blue.600" fontWeight="700">
                {metrics.timeMinutes > 0 && `${metrics.timeMinutes}m `}
                {metrics.timeSeconds}s
              </Text>
            </HStack>
          </HStack>
        ) : undefined
      }
      contentProps={{ p: 4, display: 'flex', flexDirection: 'column' }}
    >
      <VStack spacing={4} align="stretch" flex="1" h="100%">
        {isComparing && (
          <VStack spacing={4} flex="1" justify="center">
            <Spinner size="xl" color="purple.500" thickness="4px" />
            <Text color="gray.600">AI is analyzing the files...</Text>
          </VStack>
        )}

        {!isComparing && comparisonResult && (
          <>
            <Box
              flex="1"
              bg="gray.50"
              p={4}
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
              overflow="auto"
            >
              <Text whiteSpace="pre-wrap" fontFamily="monospace" fontSize="sm">
                {comparisonResult}
              </Text>
            </Box>
            {debugInfo && (
              <DebugInfoPanel debugInfo={debugInfo} cost={metrics?.cost || 0} />
            )}
          </>
        )}

        {!isComparing && !comparisonResult && (
          <VStack spacing={3} flex="1" justify="center" color="gray.400">
            <Icon as={FiFileText} boxSize={16} />
            <Text fontSize="lg" fontWeight="500">
              No results yet
            </Text>
            <Text fontSize="sm" textAlign="center" maxW="400px">
              Upload DT Max Workspace and Client Tax Slips, then click
              &quot;Compare with AI&quot; to see the results here.
            </Text>
          </VStack>
        )}
      </VStack>
    </SectionCard>
  );
}

export default ResultsPanel;
