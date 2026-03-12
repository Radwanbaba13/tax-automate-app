import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Collapse,
  Flex,
  HStack,
  Select,
  Text,
  Textarea,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import {
  IoChevronDown,
  IoChevronForward,
  IoEye,
  IoEyeOff,
} from 'react-icons/io5';
import { api } from '../../Utils/apiClient';
import { showToast } from '../../Utils/toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DocBlockStyle {
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  alignment?: 'left' | 'center' | 'right';
}

interface DocTextBlock {
  text: string;
  style: DocBlockStyle;
}

type DocTypeKey =
  | 'individual_en'
  | 'individual_fr'
  | 'couple_en'
  | 'couple_fr'
  | 'multiyear_en'
  | 'multiyear_fr';

type DocTextConfigType = Record<string, Record<string, DocTextBlock>>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DOC_TYPES: { key: DocTypeKey; label: string }[] = [
  { key: 'individual_en', label: 'Individual EN' },
  { key: 'individual_fr', label: 'Individual FR' },
  { key: 'couple_en', label: 'Couple EN' },
  { key: 'couple_fr', label: 'Couple FR' },
  { key: 'multiyear_en', label: 'Multi-year EN' },
  { key: 'multiyear_fr', label: 'Multi-year FR' },
];

const SECTIONS: { label: string; keys: string[] }[] = [
  { label: 'Document Title', keys: ['docTitle'] },
  {
    label: 'Introduction',
    keys: [
      'introAttachment',
      'introPassword',
      'introCopyDescription',
      'introCopyNoPrint',
      'introCopyKeep',
      'veryImportantHeading',
    ],
  },
  {
    label: 'QC + Mail (Federal)',
    keys: [
      'qcMailFedTitle',
      'qcMailFedNotSubmitted',
      'qcMailFedAuthForm',
      'qcMailSignPartF',
    ],
  },
  {
    label: 'QC + Mail (Quebec)',
    keys: [
      'qcMailQCTitle',
      'qcMailQCCannotEfile',
      'qcMailQCPrint',
      'qcAddress',
      'qcMailOnBehalf',
    ],
  },
  {
    label: 'QC EFILE',
    keys: [
      'qcEfileNotSubmitted',
      'qcEfileAuthForms',
      'qcEfileSignFed',
      'qcEfileSignQC',
    ],
  },
  {
    label: 'Non-Quebec',
    keys: ['nonQcNotSubmitted', 'nonQcAuthForm', 'nonQcSignPartF'],
  },
  {
    label: 'Results',
    keys: [
      'resultsHeading',
      'federalReturnLabel',
      'quebecReturnLabel',
      'refundPrefix',
      'owingPrefix',
      'noBalance',
    ],
  },
  {
    label: 'Payment Reminder',
    keys: [
      'paymentOwingFedAndQC',
      'paymentOwingFed',
      'paymentOwingQC',
      'paymentDeadline',
      'paymentHowTo',
    ],
  },
  {
    label: 'Tuition Carryforward',
    keys: [
      'tuitionTitle',
      'tuitionFedLabel',
      'tuitionQCLabel',
      'tuitionExplanation',
    ],
  },
  {
    label: 'Section Titles',
    keys: [
      'solidarityTitle',
      'gstTitle',
      'ecgebTitle',
      'carbonRebateTitle',
      'climateActionTitle',
      'ontarioTrilliumTitle',
      'ccbTitle',
      'familyAllowanceTitle',
      'carryforwardTitle',
    ],
  },
  {
    label: 'Conclusion',
    keys: ['conclusionWaiting', 'thankYou', 'disclaimer'],
  },
];

const BLOCK_LABELS: Record<string, string> = {
  docTitle: 'Document title',
  introAttachment: 'Attachment intro',
  introPassword: 'Password instruction',
  introCopyDescription: 'COPY file description',
  introCopyNoPrint: '"No need to print"',
  introCopyKeep: '"Keep for records"',
  veryImportantHeading: '"Very Important"',
  qcMailFedTitle: 'Federal sub-heading',
  qcMailFedNotSubmitted: '"Not submitted yet"',
  qcMailFedAuthForm: 'Auth form(s) attached',
  qcMailSignPartF: '"Sign Part F"',
  qcMailQCTitle: 'Quebec sub-heading',
  qcMailQCCannotEfile: 'Cannot e-file QC',
  qcMailQCPrint: 'Print & mail QC',
  qcAddress: 'RQ mailing address',
  qcMailOnBehalf: 'Mail-on-behalf offer',
  qcEfileNotSubmitted: '"Not submitted yet"',
  qcEfileAuthForms: 'Auth forms attached',
  qcEfileSignFed: '"Sign Federal Part F"',
  qcEfileSignQC: '"Sign QC section 4"',
  nonQcNotSubmitted: '"Not submitted yet"',
  nonQcAuthForm: 'Auth form(s) attached',
  nonQcSignPartF: '"Sign Part F"',
  resultsHeading: '"RESULTS" heading',
  federalReturnLabel: 'Federal return label',
  quebecReturnLabel: 'Quebec return label',
  refundPrefix: 'Refund prefix',
  owingPrefix: 'Owing prefix',
  noBalance: 'No balance text',
  paymentOwingFedAndQC: 'Owing Fed + QC',
  paymentOwingFed: 'Owing Federal',
  paymentOwingQC: 'Owing Quebec',
  paymentDeadline: 'Payment deadline',
  paymentHowTo: 'How to pay',
  tuitionTitle: 'Tuition title',
  tuitionFedLabel: 'Federal tuition label',
  tuitionQCLabel: 'QC tuition label',
  tuitionExplanation: 'Tuition explanation',
  solidarityTitle: 'Solidarity Credits',
  gstTitle: 'GST/HST Credits',
  ecgebTitle: 'Canada Groceries',
  carbonRebateTitle: 'Carbon Rebate',
  climateActionTitle: 'Climate Action',
  ontarioTrilliumTitle: 'Ontario Trillium',
  ccbTitle: 'Canada Child Benefit',
  familyAllowanceTitle: 'Family Allowance',
  carryforwardTitle: 'Carryforward Amounts',
  conclusionWaiting: '"Waiting for auth"',
  thankYou: '"Thank you"',
  disclaimer: 'Disclaimer',
};

// ---------------------------------------------------------------------------
// Style toggle button
// ---------------------------------------------------------------------------
function StyleBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      w="26px"
      h="26px"
      borderRadius="6px"
      border="1px solid"
      borderColor={active ? '#cf3350' : '#e2e8f0'}
      bg={active ? '#cf3350' : 'white'}
      color={active ? 'white' : '#a0aec0'}
      fontSize="12px"
      fontWeight="700"
      lineHeight="26px"
      cursor="pointer"
      transition="all 0.15s"
      textAlign="center"
      _hover={{ borderColor: '#cf3350', color: active ? 'white' : '#cf3350' }}
      _dark={{
        borderColor: active ? '#cf3350' : '#464646',
        bg: active ? '#cf3350' : '#2a2a2a',
      }}
    >
      {label}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Block editor row
// ---------------------------------------------------------------------------
function BlockRow({
  blockKey,
  block,
  onChange,
}: {
  blockKey: string;
  block: DocTextBlock;
  onChange: (updated: DocTextBlock) => void;
}) {
  const style = block.style || {};
  const updateStyle = (patch: Partial<DocBlockStyle>) => {
    onChange({ ...block, style: { ...style, ...patch } });
  };
  const colorValue = style.color || '#000000';

  return (
    <Box
      py={3}
      borderBottom="1px solid"
      borderColor="#f0f0f0"
      _dark={{ borderColor: '#363636' }}
    >
      <Flex justify="space-between" align="center" mb={2}>
        <Text
          fontSize="13px"
          color="#555"
          _dark={{ color: 'gray.400' }}
          fontWeight="600"
        >
          {BLOCK_LABELS[blockKey] || blockKey}
        </Text>
        <HStack spacing={1.5}>
          <Tooltip label="Text color" hasArrow>
            <Box
              position="relative"
              w="26px"
              h="26px"
              borderRadius="6px"
              overflow="hidden"
              border="1px solid"
              borderColor="#e2e8f0"
              _dark={{ borderColor: '#464646' }}
            >
              <Box
                as="input"
                type="color"
                value={colorValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateStyle({ color: e.target.value })
                }
                position="absolute"
                inset={0}
                w="100%"
                h="100%"
                opacity={0}
                cursor="pointer"
              />
              <Box w="100%" h="100%" bg={colorValue} pointerEvents="none" />
            </Box>
          </Tooltip>
          <StyleBtn
            label="B"
            active={!!style.bold}
            onClick={() => updateStyle({ bold: !style.bold })}
          />
          <StyleBtn
            label="I"
            active={!!style.italic}
            onClick={() => updateStyle({ italic: !style.italic })}
          />
          <StyleBtn
            label="U"
            active={!!style.underline}
            onClick={() => updateStyle({ underline: !style.underline })}
          />
          <Tooltip label="Font size (pt)" hasArrow>
            <Box
              as="input"
              type="number"
              min={6}
              max={72}
              value={style.fontSize ?? 10}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateStyle({ fontSize: Number(e.target.value) })
              }
              w="46px"
              h="26px"
              px={1}
              fontSize="13px"
              borderRadius="6px"
              border="1px solid"
              borderColor="#e2e8f0"
              textAlign="center"
              _hover={{ borderColor: '#cf3350' }}
              _focus={{ borderColor: '#cf3350', outline: 'none' }}
              _dark={{
                borderColor: '#464646',
                bg: '#2a2a2a',
                color: 'gray.100',
              }}
            />
          </Tooltip>
          {blockKey === 'docTitle' &&
            (['left', 'center', 'right'] as const).map((a) => (
              <StyleBtn
                key={a}
                label={a[0].toUpperCase()}
                active={style.alignment === a}
                onClick={() => updateStyle({ alignment: a })}
              />
            ))}
        </HStack>
      </Flex>
      <Textarea
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        rows={1}
        fontSize="14px"
        borderColor="#e2e8f0"
        borderRadius="8px"
        resize="vertical"
        _hover={{ borderColor: '#cf3350' }}
        _focus={{ borderColor: '#cf3350', boxShadow: '0 0 0 1px #cf3350' }}
        _dark={{
          borderColor: '#464646',
          bg: '#2a2a2a',
          color: 'gray.100',
        }}
      />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Left navigation sidebar
// ---------------------------------------------------------------------------
function NavSidebar({
  activeSection,
  onSelectSection,
  expandedSections,
  onToggleSection,
  typeBlocks,
}: {
  activeSection: number;
  onSelectSection: (idx: number) => void;
  expandedSections: Set<number>;
  onToggleSection: (idx: number) => void;
  typeBlocks: Record<string, DocTextBlock>;
}) {
  return (
    <Box
      w="200px"
      minW="200px"
      overflowY="auto"
      background="#f7f7f7"
      _dark={{ background: '#1e1e1e' }}
      borderRadius="5px"
      pr={3}
      py={3}
    >
      {/* Sections nav */}
      <Text
        fontSize="12px"
        fontWeight="700"
        color="#7a8390"
        textTransform="uppercase"
        letterSpacing="0.08em"
        mb={2}
        px={3}
      >
        Sections
      </Text>
      <VStack spacing={0} align="stretch" px={1}>
        {SECTIONS.map((section, idx) => {
          const hasBlocks = section.keys.some(
            (k) => typeBlocks[k] !== undefined,
          );
          if (!hasBlocks) return null;
          const isExpanded = expandedSections.has(idx);
          const isActive = activeSection === idx;

          return (
            <Box key={section.label}>
              <Flex
                as="button"
                onClick={() => {
                  onToggleSection(idx);
                  onSelectSection(idx);
                }}
                align="center"
                w="100%"
                textAlign="left"
                px={3}
                py={1.5}
                fontSize="13px"
                fontWeight={isActive ? '600' : '400'}
                color={isActive ? '#cf3350' : '#4a5568'}
                bg={isActive ? 'rgba(207,51,80,0.06)' : 'transparent'}
                borderRadius="6px"
                cursor="pointer"
                _hover={{ bg: isActive ? 'rgba(207,51,80,0.06)' : '#f7fafc' }}
                _dark={{
                  color: isActive ? '#cf3350' : 'gray.300',
                  _hover: {
                    bg: isActive ? 'rgba(207,51,80,0.12)' : '#2e2e2e',
                  },
                }}
                transition="all 0.15s"
                gap={2}
              >
                <Box
                  as="span"
                  fontSize="10px"
                  color={isActive ? '#cf3350' : '#afb6c0'}
                  flexShrink={0}
                  mt="1px"
                >
                  {isExpanded ? <IoChevronDown /> : <IoChevronForward />}
                </Box>
                <Text noOfLines={1}>{section.label}</Text>
              </Flex>
              <Collapse in={isExpanded} animateOpacity>
                <VStack spacing={0} align="stretch" pl={8} pr={2} py={1}>
                  {section.keys
                    .filter((k) => typeBlocks[k] !== undefined)
                    .map((k) => (
                      <Text
                        key={k}
                        as="button"
                        textAlign="left"
                        fontSize="12px"
                        color={isActive ? '#cf3350' : '#afb6c0'}
                        py={1}
                        cursor="pointer"
                        _hover={{ color: '#cf3350' }}
                        noOfLines={1}
                        transition="color 0.1s"
                        onClick={() => {
                          onSelectSection(idx);
                          const el = document.getElementById(`block-${k}`);
                          el?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                          });
                        }}
                      >
                        {BLOCK_LABELS[k] || k}
                      </Text>
                    ))}
                </VStack>
              </Collapse>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Preview panel — active section only
// ---------------------------------------------------------------------------
function DocPreview({
  typeBlocks,
  activeSection,
}: {
  typeBlocks: Record<string, DocTextBlock>;
  activeSection: number;
}) {
  const section = SECTIONS[activeSection];
  if (!section) return null;

  const sectionKeys = section.keys.filter((k) => typeBlocks[k] !== undefined);

  return (
    <Box
      flex={1}
      overflowY="auto"
      bg="#fafbfc"
      _dark={{ bg: '#1a1a1a' }}
      px={6}
      py={4}
    >
      <Text
        fontSize="11px"
        fontWeight="700"
        color="#a0aec0"
        textTransform="uppercase"
        letterSpacing="0.08em"
        mb={4}
      >
        Preview - {section.label}
      </Text>
      <Box
        border="1px solid #edf2f7"
        borderRadius="8px"
        bg="white"
        p={8}
        boxShadow="0 1px 3px rgba(0,0,0,0.04)"
      >
        {sectionKeys.length === 0 ? (
          <Text fontSize="14px" color="#a0aec0" fontStyle="italic">
            No blocks in this section
          </Text>
        ) : (
          sectionKeys.map((key) => {
            const block = typeBlocks[key];
            const s = block.style || {};

            return (
              <Text
                key={key}
                fontSize={s.fontSize ? `${s.fontSize}pt` : '10pt'}
                fontWeight={s.bold ? '700' : '400'}
                fontStyle={s.italic ? 'italic' : 'normal'}
                textDecoration={s.underline ? 'underline' : 'none'}
                color={s.color || '#000000'}
                textAlign={s.alignment || 'left'}
                mb={2}
                whiteSpace="pre-wrap"
                lineHeight="1.6"
              >
                {block.text}
              </Text>
            );
          })
        )}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function DocTextConfig() {
  const [config, setConfig] = useState<DocTextConfigType>({});
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDocType, setActiveDocType] =
    useState<DocTypeKey>('individual_en');
  const [activeSection, setActiveSection] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([0, 1]),
  );
  const [showPreview, setShowPreview] = useState(false);
  const originalRef = useRef<DocTextConfigType>({});
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await api.docTextConfig.get();
      if (error) {
        showToast({
          title: 'Failed to load document text config',
          status: 'error',
        });
        return;
      }
      if (data) {
        setConfig(data);
        originalRef.current = JSON.parse(JSON.stringify(data));
      }
    })();
  }, []);

  const handleBlockChange = useCallback(
    (docType: string, blockKey: string, updated: DocTextBlock) => {
      setConfig((prev) => ({
        ...prev,
        [docType]: { ...prev[docType], [blockKey]: updated },
      }));
      setIsModified(true);
    },
    [],
  );

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await api.docTextConfig.update(config);
    setIsSaving(false);
    if (error) {
      showToast({
        title: 'Failed to save',
        description: error.message,
        status: 'error',
      });
    } else {
      originalRef.current = JSON.parse(JSON.stringify(config));
      setIsModified(false);
      showToast({ title: 'Document text saved', status: 'success' });
    }
  };

  const handleReset = () => {
    setConfig(JSON.parse(JSON.stringify(originalRef.current)));
    setIsModified(false);
    showToast({ title: 'Changes discarded', status: 'warning' });
  };

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const typeBlocks = config[activeDocType] || {};

  return (
    <Box>
      {/* Header */}
      <Flex align="center" justify="space-between" mb={0} gap={4}>
        <HStack spacing={3} flex={1}>
          <Text
            fontSize="13px"
            fontWeight="600"
            color="#718096"
            whiteSpace="nowrap"
          >
            Document Type:
          </Text>
          <Select
            value={activeDocType}
            onChange={(e) => setActiveDocType(e.target.value as DocTypeKey)}
            maxW="240px"
            size="md"
            fontSize="14px"
            fontWeight="bold"
            bg="white"
            border="none"
            borderBottom="2px solid #cf3350"
            borderRadius="0"
            color="#2d3748"
            cursor="pointer"
            _hover={{ borderBottomColor: '#a82941' }}
            _focus={{ borderBottomColor: '#cf3350', boxShadow: 'none' }}
            _dark={{ bg: '#2a2a2a', color: 'gray.100' }}
          >
            {DOC_TYPES.map(({ key, label }) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </HStack>
        <HStack spacing={2} flexShrink={0}>
          <Button
            size="sm"
            variant={showPreview ? 'solid' : 'outline'}
            bg={showPreview ? '#386498' : undefined}
            color={showPreview ? 'white' : '#386498'}
            borderColor="#386498"
            borderRadius="8px"
            _hover={{ opacity: 0.7 }}
            leftIcon={showPreview ? <IoEye /> : <IoEyeOff />}
            onClick={() => setShowPreview((v) => !v)}
          >
            Preview
          </Button>
          <Button
            size="sm"
            variant="outline"
            borderColor="#cf3350"
            color="#cf3350"
            borderRadius="8px"
            _hover={{ opacity: 0.5 }}
            onClick={handleReset}
            isDisabled={!isModified}
          >
            Discard
          </Button>
          <Button
            size="sm"
            bg="#cf3350"
            color="white"
            borderRadius="8px"
            _hover={{ opacity: 0.5 }}
            isLoading={isSaving}
            onClick={handleSave}
            isDisabled={!isModified}
          >
            Save Changes
          </Button>
        </HStack>
      </Flex>

      {/* Divider */}
      <Box h="2px" bg="#e2e8f0" _dark={{ bg: '#363636' }} mt={2} mb={4} />

      {/* Layout */}
      <Flex gap={0} h="60vh">
        {/* LEFT sidebar */}
        <NavSidebar
          activeSection={activeSection}
          onSelectSection={(idx) => {
            setActiveSection(idx);
            const el = document.getElementById(`section-${idx}`);
            if (el && editorRef.current) {
              const container = editorRef.current;
              const top = el.offsetTop - container.offsetTop;
              container.scrollTo({ top, behavior: 'smooth' });
            }
          }}
          expandedSections={expandedSections}
          onToggleSection={toggleSection}
          typeBlocks={typeBlocks}
        />

        {/* Sidebar separator */}
        <Box w="1px" bg="#edf2f7" _dark={{ bg: '#363636' }} flexShrink={0} />

        {/* MIDDLE editor */}
        <Box ref={editorRef} flex={1} overflowY="auto" px={5}>
          {SECTIONS.map((section, idx) => {
            const sectionBlocks = section.keys.filter(
              (k) => typeBlocks[k] !== undefined,
            );
            if (sectionBlocks.length === 0) return null;

            return (
              <Box key={section.label} id={`section-${idx}`} mb={5}>
                <Text
                  fontSize="14px"
                  fontWeight="700"
                  color="#cf3350"
                  borderBottom="2px solid #cf3350"
                  pb={1}
                  mb={2}
                >
                  {section.label}
                </Text>
                {sectionBlocks.map((blockKey) => (
                  <Box key={blockKey} id={`block-${blockKey}`}>
                    <BlockRow
                      blockKey={blockKey}
                      block={typeBlocks[blockKey]}
                      onChange={(updated) =>
                        handleBlockChange(activeDocType, blockKey, updated)
                      }
                    />
                  </Box>
                ))}
              </Box>
            );
          })}
        </Box>

        {/* RIGHT preview */}
        {showPreview && (
          <>
            <Box
              w="1px"
              bg="#edf2f7"
              _dark={{ bg: '#363636' }}
              flexShrink={0}
            />
            <DocPreview typeBlocks={typeBlocks} activeSection={activeSection} />
          </>
        )}
      </Flex>
    </Box>
  );
}
