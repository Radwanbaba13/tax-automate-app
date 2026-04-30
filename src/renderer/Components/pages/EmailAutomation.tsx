import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  Box,
  Text,
  Textarea,
  Button,
  Input,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import {
  MdContentCopy,
  MdAdd,
  MdDelete,
  MdEdit,
  MdAutoFixHigh,
  MdAutoAwesome,
  MdReply,
  MdBookmarks,
  MdSearch,
  MdHistory,
} from 'react-icons/md';
import { showToast } from '../../Utils/toast';
import SectionCard from '../common/SectionCard';
import SegmentedControl from '../common/SegmentedControl';
import RichTextEditor from '../common/RichTextEditor';
import {
  copyRichText,
  wrapInEmailHtml,
  htmlToPlainText,
} from '../../Utils/clipboardUtils';

interface EmailTemplate {
  id: string;
  name: string;
  subjectEN: string;
  subjectFR: string;
  contentEN: string;
  contentFR: string;
  createdAt: string;
}

interface SuggestSource {
  subject: string;
  score: number;
  date: string;
  customerText: string;
  agentText: string;
}

function formatSourceDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Sparkle animation for AI button
const sparkle = keyframes`
  0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
  50% { opacity: 0.8; transform: scale(1.1) rotate(180deg); }
`;

function EmailAutomationComponent() {
  const [customerInquiry, setCustomerInquiry] = useState('');
  const [inquiryLanguage, setInquiryLanguage] = useState<'EN' | 'FR'>('EN');
  const [responseSubjectEN, setResponseSubjectEN] = useState('');
  const [responseSubjectFR, setResponseSubjectFR] = useState('');
  const [responseText, setResponseText] = useState('');
  const [generatedSubjectEN, setGeneratedSubjectEN] = useState('');
  const [generatedSubjectFR, setGeneratedSubjectFR] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');

  // Template management modals
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const deleteRef = React.useRef<HTMLButtonElement>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateSubjectEN, setNewTemplateSubjectEN] = useState('');
  const [newTemplateSubjectFR, setNewTemplateSubjectFR] = useState('');
  const [newTemplateContentEN, setNewTemplateContentEN] = useState('');
  const [newTemplateContentFR, setNewTemplateContentFR] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [isFixing, setIsFixing] = useState(false);
  const [fixingLanguage, setFixingLanguage] = useState<'EN' | 'FR'>('EN');
  const [, setIsTemplatesLoading] = useState(false);

  // Reply Assistant state
  const [ragQuery, setRagQuery] = useState('');
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<
    [string, string, string] | null
  >(null);
  const [sources, setSources] = useState<SuggestSource[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(
    null,
  );
  const [selectedReply, setSelectedReply] = useState('');

  // Load templates from DB on mount (fallback to localStorage if DB fails)
  useEffect(() => {
    const loadTemplates = async () => {
      setIsTemplatesLoading(true);
      try {
        const res = await window.electron.database.getAllEmailTemplates();
        if (res && res.data) {
          const mapped = res.data.map((t: any) => ({
            id: String(t.id),
            name: t.template_name,
            subjectEN: t.subject_en || '',
            subjectFR: t.subject_fr || '',
            contentEN: t.content_en || '',
            contentFR: t.content_fr || '',
            createdAt: t.created_at || new Date().toISOString(),
          }));
          setTemplates(mapped);
        } else if (res && res.error) {
          throw new Error(res.error.message || 'Failed to load templates');
        } else {
          // Fall back to localStorage
          const savedTemplates = localStorage.getItem('emailTemplates');
          if (savedTemplates) {
            try {
              const parsed = JSON.parse(savedTemplates);
              const migrated = parsed.map((t: any) => ({
                ...t,
                subjectEN: t.subjectEN || t.subject || '',
                subjectFR: t.subjectFR || '',
                contentEN: t.contentEN || t.content || '',
                contentFR: t.contentFR || '',
              }));
              setTemplates(migrated);
            } catch {
              // ignore
            }
          }
        }
      } catch (error: any) {
        showToast({
          title: 'Error loading templates',
          description: error.message || 'Failed to load email templates',
          status: 'error',
        });

        // fallback to localStorage if available
        const savedTemplates = localStorage.getItem('emailTemplates');
        if (savedTemplates) {
          try {
            const parsed = JSON.parse(savedTemplates);
            const migrated = parsed.map((t: any) => ({
              ...t,
              subjectEN: t.subjectEN || t.subject || '',
              subjectFR: t.subjectFR || '',
              contentEN: t.contentEN || t.content || '',
              contentFR: t.contentFR || '',
            }));
            setTemplates(migrated);
          } catch {
            // ignore
          }
        }
      } finally {
        setIsTemplatesLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // Save templates to localStorage whenever they change
  useEffect(() => {
    if (templates.length > 0 || localStorage.getItem('emailTemplates')) {
      localStorage.setItem('emailTemplates', JSON.stringify(templates));
    }
  }, [templates]);

  const handleCreateTemplate = async () => {
    if (
      !newTemplateName.trim() ||
      (!htmlToPlainText(newTemplateContentEN).trim() &&
        !htmlToPlainText(newTemplateContentFR).trim())
    ) {
      showToast({
        title: 'Missing information',
        description: 'Please provide a name and at least one language content.',
        status: 'warning',
      });
      return;
    }

    try {
      const res = await window.electron.database.createEmailTemplate({
        template_name: newTemplateName,
        subject_en: newTemplateSubjectEN,
        subject_fr: newTemplateSubjectFR,
        content_en: newTemplateContentEN,
        content_fr: newTemplateContentFR,
      });

      if (res && res.data) {
        const created = res.data;
        const createdTemplate: EmailTemplate = {
          id: String(created.id),
          name: created.template_name || newTemplateName,
          subjectEN: created.subject_en || newTemplateSubjectEN,
          subjectFR: created.subject_fr || newTemplateSubjectFR,
          contentEN: created.content_en || newTemplateContentEN,
          contentFR: created.content_fr || newTemplateContentFR,
          createdAt: created.created_at || new Date().toISOString(),
        };
        setTemplates((prev) => [...prev, createdTemplate]);

        setNewTemplateName('');
        setNewTemplateSubjectEN('');
        setNewTemplateSubjectFR('');
        setNewTemplateContentEN('');
        setNewTemplateContentFR('');
        onCreateClose();

        showToast({
          title: 'Template created',
          description: 'Your email template has been created successfully.',
          status: 'success',
        });
      } else {
        throw new Error(res?.error?.message || 'Failed to create template');
      }
    } catch (error: any) {
      showToast({
        title: 'Template not saved',
        description: error.message || 'Failed to create template',
        status: 'error',
      });
    }
  };

  const handleEditTemplate = async () => {
    if (
      !editingTemplate ||
      !newTemplateName.trim() ||
      (!htmlToPlainText(newTemplateContentEN).trim() &&
        !htmlToPlainText(newTemplateContentFR).trim())
    ) {
      return;
    }

    try {
      const res = await window.electron.database.updateEmailTemplate(
        Number(editingTemplate.id),
        {
          template_name: newTemplateName,
          subject_en: newTemplateSubjectEN,
          subject_fr: newTemplateSubjectFR,
          content_en: newTemplateContentEN,
          content_fr: newTemplateContentFR,
        },
      );

      if (res && res.data) {
        const updated = res.data;
        const updatedTemplates = templates.map((t) =>
          t.id === editingTemplate.id
            ? {
                ...t,
                name: updated.template_name || newTemplateName,
                subjectEN: updated.subject_en || newTemplateSubjectEN,
                subjectFR: updated.subject_fr || newTemplateSubjectFR,
                contentEN: updated.content_en || newTemplateContentEN,
                contentFR: updated.content_fr || newTemplateContentFR,
              }
            : t,
        );

        setTemplates(updatedTemplates);
        setEditingTemplate(null);
        setNewTemplateName('');
        setNewTemplateSubjectEN('');
        setNewTemplateSubjectFR('');
        setNewTemplateContentEN('');
        setNewTemplateContentFR('');
        onEditClose();

        showToast({
          title: 'Template updated',
          description: 'Your email template has been updated successfully.',
          status: 'success',
        });
      } else {
        throw new Error(res?.error?.message || 'Failed to update template');
      }
    } catch (error: any) {
      showToast({
        title: 'Update failed',
        description: error.message || 'Failed to update template',
        status: 'error',
      });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const res = await window.electron.database.deleteEmailTemplate(
        Number(id),
      );
      if (res && res.data) {
        const updatedTemplates = templates.filter((t) => t.id !== id);
        setTemplates(updatedTemplates);
        if (selectedTemplateId === id) {
          setSelectedTemplateId(null);
          setResponseSubjectEN('');
          setResponseSubjectFR('');
          setResponseText('');
        }

        showToast({
          title: 'Template deleted',
          description: 'The template has been removed.',
          status: 'success',
        });
      } else {
        throw new Error(res?.error?.message || 'Failed to delete template');
      }
    } catch (error: any) {
      showToast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete template',
        status: 'error',
      });
    }
  };

  const openEditModal = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setNewTemplateName(template.name);
    setNewTemplateSubjectEN(template.subjectEN);
    setNewTemplateSubjectFR(template.subjectFR);
    setNewTemplateContentEN(template.contentEN);
    setNewTemplateContentFR(template.contentFR);
    onEditOpen();
  };

  const handleFixTemplate = async () => {
    if (!editingTemplate) return;

    setIsFixing(true);

    const contentToFix =
      fixingLanguage === 'EN' ? newTemplateContentEN : newTemplateContentFR;

    try {
      const response =
        await window.electron.fixEmailTemplateWithAI(contentToFix);

      if (response.success && response.result) {
        if (fixingLanguage === 'EN') {
          setNewTemplateContentEN(response.result);
        } else {
          setNewTemplateContentFR(response.result);
        }
        showToast({
          title: 'Template fixed',
          description: `Your ${fixingLanguage} template has been improved with AI.`,
          status: 'success',
        });
      } else {
        throw new Error(response.error || 'Failed to fix template');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fix template with AI.';
      let userMessage = errorMessage;

      // Handle specific API errors
      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        userMessage =
          'API quota exceeded. Please check your API Services configuration.';
      } else if (
        errorMessage.includes('401') ||
        errorMessage.includes('unauthorized')
      ) {
        userMessage =
          'Invalid API key. Please check your API Services key configuration.';
      } else if (errorMessage.includes('rate limit')) {
        userMessage =
          'Rate limit exceeded. Please wait a moment and try again.';
      }

      showToast({
        title: 'AI request failed',
        description: userMessage,
        status: 'error',
      });
    } finally {
      setIsFixing(false);
    }
  };

  const handleTemplateClick = (template: EmailTemplate) => {
    // Replace response with template based on current inquiry language
    if (inquiryLanguage === 'EN') {
      setResponseSubjectEN(template.subjectEN);
      setResponseText(template.contentEN || '');
    } else {
      setResponseSubjectFR(template.subjectFR);
      setResponseText(template.contentFR || '');
    }
    setSelectedTemplateId(template.id);
  };

  const handleRefineWithAI = async () => {
    // Customer inquiry is now optional - removed validation

    if (!htmlToPlainText(responseText).trim()) {
      showToast({
        title: 'Missing response',
        description: 'Please enter a response to refine.',
        status: 'warning',
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedSubjectEN('');
    setGeneratedSubjectFR('');
    setGeneratedEmail('');

    try {
      const currentSubject =
        inquiryLanguage === 'EN' ? responseSubjectEN : responseSubjectFR;
      const fullResponse = currentSubject
        ? `Subject: ${currentSubject}\n\n${responseText}`
        : responseText;

      const response = await window.electron.generateEmailResponse({
        customerInquiry,
        replyMode: 'template-ai',
        templateContent: fullResponse,
      });

      if (response.success) {
        const { result } = response;
        const emailContent = result?.body || '';
        const extractedSubject = result?.subject || '';

        // Set subject
        if (extractedSubject) {
          if (inquiryLanguage === 'EN') {
            setGeneratedSubjectEN(extractedSubject);
          } else {
            setGeneratedSubjectFR(extractedSubject);
          }
        }

        setGeneratedEmail(emailContent);
      } else {
        throw new Error(response.error || 'Failed to refine email');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to refine email response.';
      let userMessage = errorMessage;

      // Handle specific API errors
      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        userMessage =
          'API quota exceeded. Please check your API Services configuration.';
      } else if (
        errorMessage.includes('401') ||
        errorMessage.includes('unauthorized')
      ) {
        userMessage =
          'Invalid API key. Please check your API Services key configuration.';
      } else if (errorMessage.includes('rate limit')) {
        userMessage =
          'Rate limit exceeded. Please wait a moment and try again.';
      }

      showToast({
        title: 'AI request failed',
        description: userMessage,
        status: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyEmail = async () => {
    await copyRichText(wrapInEmailHtml(generatedEmail));
    showToast({
      title: 'Copied!',
      description: 'Email content copied to clipboard.',
      status: 'success',
      duration: 2000,
    });
  };

  const handleGetSuggestions = async () => {
    if (!ragQuery.trim()) return;
    setIsFetchingSuggestions(true);
    setSuggestions(null);
    setSources([]);
    setSelectedSuggestion(null);
    setSelectedReply('');
    try {
      const response = await window.electron.suggestReplies(ragQuery);
      if (!response.success) {
        const { code } = response;
        if (code === 'IRRELEVANT_QUERY') {
          showToast({
            title: 'Not a support inquiry',
            description:
              'This message does not appear to be a customer support inquiry. Please paste an actual customer email.',
            status: 'warning',
          });
        } else if (code === 'NO_RELEVANT_CASES') {
          showToast({
            title: 'No similar cases found',
            description:
              'No past support cases matched this inquiry. Try rephrasing or providing more detail.',
            status: 'warning',
          });
        } else {
          showToast({
            title: 'Failed to get suggestions',
            description: response.error || 'An unexpected error occurred.',
            status: 'error',
          });
        }
        return;
      }
      setSuggestions(response.result!.suggestions);
      setSources(response.result!.sources);
    } catch (error: any) {
      showToast({
        title: 'Failed to get suggestions',
        description: error.message || 'An unexpected error occurred.',
        status: 'error',
      });
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const handleUseSuggestion = (index: number, text: string) => {
    setSelectedSuggestion(index);
    setSelectedReply(text);
  };

  const handleCopySelectedReply = async () => {
    await navigator.clipboard.writeText(selectedReply);
    showToast({
      title: 'Copied!',
      description: 'Reply copied to clipboard.',
      status: 'success',
      duration: 2000,
    });
  };

  const handleCopySuggestion = async (text: string, index: number) => {
    setSelectedSuggestion(index);
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    const html = `<span style="font-family: Arial, sans-serif; font-size: 10pt;">${escaped}</span>`;
    await copyRichText(html);
    showToast({
      title: 'Copied!',
      description: 'Reply copied to clipboard.',
      status: 'success',
      duration: 2000,
    });
  };

  return (
    <Tabs colorScheme="brand">
      <TabList marginTop="-15px">
        <Tab fontWeight="bold">Templates</Tab>
        <Tab fontWeight="bold">Reply Assistant</Tab>
      </TabList>
      <TabPanels>
        <TabPanel px={0} pt={4}>
          <VStack spacing={4} align="stretch" w="100%">
            <HStack spacing={4} align="stretch" w="100%">
              <VStack spacing={4} flex={1} align="stretch">
                {/* Your Response */}
                <SectionCard
                  minH="300px"
                  icon={<MdReply size={18} />}
                  title="Your Response"
                  actions={
                    <HStack spacing={2}>
                      <SegmentedControl
                        options={[
                          { label: 'EN', value: 'EN', colorScheme: 'red' },
                          { label: 'FR', value: 'FR', colorScheme: 'blue' },
                        ]}
                        value={inquiryLanguage}
                        onChange={(v) => setInquiryLanguage(v as 'EN' | 'FR')}
                      />
                      <Button
                        leftIcon={<MdContentCopy />}
                        size="sm"
                        onClick={async () => {
                          await copyRichText(wrapInEmailHtml(responseText));
                          showToast({
                            title: 'Copied!',
                            description: 'Response copied to clipboard.',
                            status: 'success',
                            duration: 2000,
                          });
                        }}
                        isDisabled={!htmlToPlainText(responseText).trim()}
                      >
                        Copy
                      </Button>
                    </HStack>
                  }
                  contentProps={{ p: 4 }}
                >
                  <VStack spacing={3} align="stretch">
                    <Box>
                      <Text
                        mb={2}
                        fontSize="sm"
                        fontWeight="medium"
                        color="gray.600"
                      >
                        Subject ({inquiryLanguage})
                      </Text>
                      <Input
                        placeholder={`Email subject (${inquiryLanguage})...`}
                        value={
                          inquiryLanguage === 'EN'
                            ? responseSubjectEN
                            : responseSubjectFR
                        }
                        onChange={(e) => {
                          if (inquiryLanguage === 'EN') {
                            setResponseSubjectEN(e.target.value);
                          } else {
                            setResponseSubjectFR(e.target.value);
                          }
                        }}
                      />
                    </Box>
                    <Box>
                      <Text
                        mb={2}
                        fontSize="sm"
                        fontWeight="medium"
                        color="gray.600"
                      >
                        Content
                      </Text>
                      <RichTextEditor
                        value={responseText}
                        onChange={setResponseText}
                        placeholder="Type your response here, or click on a template to load it..."
                        minHeight="200px"
                      />
                    </Box>
                  </VStack>
                </SectionCard>

                {/* Refined Email / Placeholder - 40% */}
                <Box display="flex" flexDirection="column">
                  {generatedEmail ? (
                    <SectionCard
                      height="100%"
                      icon={<MdAutoAwesome size={18} />}
                      title="Generated Email"
                      actions={
                        <Button
                          leftIcon={<MdContentCopy />}
                          size="sm"
                          onClick={handleCopyEmail}
                        >
                          Copy to Clipboard
                        </Button>
                      }
                      contentProps={{ p: 4, overflowY: 'auto' }}
                    >
                      <VStack spacing={3} align="stretch">
                        {(() => {
                          const currentSubject =
                            inquiryLanguage === 'EN'
                              ? generatedSubjectEN
                              : generatedSubjectFR;
                          return currentSubject !== undefined ? (
                            <Box>
                              <Text
                                mb={2}
                                fontSize="sm"
                                fontWeight="medium"
                                color="gray.600"
                              >
                                Subject ({inquiryLanguage})
                              </Text>
                              <Input
                                placeholder={`Email subject (${inquiryLanguage})...`}
                                value={currentSubject}
                                onChange={(e) => {
                                  if (inquiryLanguage === 'EN') {
                                    setGeneratedSubjectEN(e.target.value);
                                  } else {
                                    setGeneratedSubjectFR(e.target.value);
                                  }
                                }}
                              />
                            </Box>
                          ) : null;
                        })()}
                        <Box>
                          <Text
                            mb={2}
                            fontSize="sm"
                            fontWeight="medium"
                            color="gray.600"
                          >
                            Content
                          </Text>
                          <RichTextEditor
                            value={generatedEmail}
                            onChange={setGeneratedEmail}
                            placeholder="Generated email content..."
                            minHeight="200px"
                          />
                        </Box>
                      </VStack>
                    </SectionCard>
                  ) : (
                    <SectionCard
                      height="100%"
                      icon={<MdAutoAwesome size={18} />}
                      title="Refined Email"
                      contentProps={{ p: 4 }}
                    >
                      <VStack
                        height="100%"
                        justify="center"
                        align="center"
                        spacing={4}
                      >
                        <Text
                          color="gray.400"
                          fontSize="sm"
                          textAlign="center"
                          maxW="260px"
                        >
                          Refine your response with AI to generate a polished
                          email
                        </Text>
                        <Button
                          leftIcon={<MdAutoAwesome />}
                          colorScheme="purple"
                          size="md"
                          onClick={handleRefineWithAI}
                          isLoading={isGenerating}
                          loadingText="Refining..."
                          sx={{
                            '& svg': {
                              animation: isGenerating
                                ? `${sparkle} 2s ease-in-out infinite`
                                : 'none',
                            },
                          }}
                        >
                          Refine with AI
                        </Button>
                      </VStack>
                    </SectionCard>
                  )}
                </Box>
              </VStack>

              <VStack spacing={4} flex={1} align="stretch">
                {/* Right: Templates */}
                <SectionCard
                  height="100%"
                  minH="500px"
                  maxH="calc(100vh - 105px)"
                  icon={<MdBookmarks size={18} />}
                  title="Email Templates"
                  subtitle={
                    templates.length > 0
                      ? `${templates.length} template${templates.length !== 1 ? 's' : ''}`
                      : undefined
                  }
                  actions={
                    <Button
                      leftIcon={<MdAdd />}
                      size="sm"
                      colorScheme="blue"
                      onClick={onCreateOpen}
                    >
                      Create
                    </Button>
                  }
                  contentProps={{ p: 4, overflowY: 'auto' }}
                >
                  <Box mb={4}>
                    <Input
                      placeholder="Search templates by name or subject..."
                      value={templateSearchQuery}
                      onChange={(e) => setTemplateSearchQuery(e.target.value)}
                      size="sm"
                    />
                  </Box>

                  {(() => {
                    // Filter templates based on search query
                    const filteredTemplates = templates.filter((template) => {
                      if (!templateSearchQuery.trim()) return true;
                      const query = templateSearchQuery.toLowerCase();
                      return (
                        template.name.toLowerCase().includes(query) ||
                        template.subjectEN.toLowerCase().includes(query) ||
                        template.subjectFR.toLowerCase().includes(query)
                      );
                    });

                    if (filteredTemplates.length === 0) {
                      return (
                        <Box
                          py={8}
                          textAlign="center"
                          color="gray.500"
                          _dark={{ color: 'gray.400' }}
                        >
                          <Text>
                            {templateSearchQuery
                              ? 'No templates found matching your search.'
                              : 'No templates yet. Create your first template!'}
                          </Text>
                        </Box>
                      );
                    }

                    return (
                      <VStack spacing={2} align="stretch">
                        {filteredTemplates.map((template) => {
                          const hasEN = !!htmlToPlainText(
                            template.contentEN,
                          ).trim();
                          const hasFR = !!htmlToPlainText(
                            template.contentFR,
                          ).trim();
                          return (
                            <Box
                              key={template.id}
                              p={3}
                              border="2px solid"
                              borderColor={
                                selectedTemplateId === template.id
                                  ? 'blue.400'
                                  : 'gray.200'
                              }
                              borderRadius="md"
                              cursor="pointer"
                              bg={
                                selectedTemplateId === template.id
                                  ? 'blue.50'
                                  : 'white'
                              }
                              _hover={{
                                bg:
                                  selectedTemplateId === template.id
                                    ? 'blue.50'
                                    : 'gray.50',
                                borderColor: 'blue.300',
                                _dark: {
                                  bg:
                                    selectedTemplateId === template.id
                                      ? '#243447'
                                      : '#2e2e2e',
                                },
                              }}
                              _dark={{
                                borderColor:
                                  selectedTemplateId === template.id
                                    ? 'blue.300'
                                    : '#363636',
                                bg:
                                  selectedTemplateId === template.id
                                    ? '#1f2933'
                                    : '#242424',
                              }}
                              onClick={() => handleTemplateClick(template)}
                              transition="all 0.2s"
                            >
                              <HStack justify="space-between">
                                <VStack align="start" spacing={1} flex={1}>
                                  <HStack>
                                    <Text fontWeight="medium">
                                      {template.name}
                                    </Text>
                                    {hasEN && (
                                      <Badge colorScheme="red" fontSize="xs">
                                        EN
                                      </Badge>
                                    )}
                                    {hasFR && (
                                      <Badge colorScheme="blue" fontSize="xs">
                                        FR
                                      </Badge>
                                    )}
                                  </HStack>
                                  {(() => {
                                    const currentSubject =
                                      inquiryLanguage === 'EN'
                                        ? template.subjectEN
                                        : template.subjectFR;
                                    return currentSubject ? (
                                      <Text
                                        fontSize="xs"
                                        color="gray.500"
                                        fontStyle="italic"
                                        _dark={{ color: 'gray.400' }}
                                      >
                                        Subject ({inquiryLanguage}):{' '}
                                        {currentSubject}
                                      </Text>
                                    ) : null;
                                  })()}
                                  <Text
                                    fontSize="sm"
                                    color="gray.600"
                                    noOfLines={2}
                                    _dark={{ color: 'gray.300' }}
                                  >
                                    {(() => {
                                      const content =
                                        inquiryLanguage === 'EN' &&
                                        template.contentEN
                                          ? template.contentEN
                                          : template.contentFR ||
                                            template.contentEN;

                                      // Strip HTML for preview
                                      const plainText =
                                        htmlToPlainText(content);
                                      return `${plainText.substring(0, 100)}...`;
                                    })()}
                                  </Text>
                                </VStack>
                                <HStack onClick={(e) => e.stopPropagation()}>
                                  <IconButton
                                    aria-label="Edit"
                                    icon={<MdEdit />}
                                    size="sm"
                                    colorScheme="blue"
                                    variant="ghost"
                                    onClick={() => openEditModal(template)}
                                  />
                                  <IconButton
                                    aria-label="Delete"
                                    icon={<MdDelete />}
                                    size="sm"
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={() => {
                                      setTemplateToDelete(template.id);
                                      onDeleteOpen();
                                    }}
                                  />
                                </HStack>
                              </HStack>
                            </Box>
                          );
                        })}
                      </VStack>
                    );
                  })()}
                </SectionCard>
              </VStack>
            </HStack>

            {/* Create Template Modal */}
            <Modal
              isOpen={isCreateOpen}
              onClose={onCreateClose}
              size="xl"
              closeOnOverlayClick={false}
            >
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Create Email Template</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text mb={2} fontWeight="medium">
                        Template Name
                      </Text>
                      <Input
                        placeholder="e.g., Common Question Response"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                      />
                    </Box>
                    <Tabs>
                      <TabList>
                        <Tab>English (EN)</Tab>
                        <Tab>Français (FR)</Tab>
                      </TabList>
                      <TabPanels>
                        <TabPanel px={0}>
                          <VStack spacing={3} align="stretch">
                            <Box>
                              <Text mb={2} fontWeight="medium">
                                Subject (EN)
                              </Text>
                              <Input
                                placeholder="Email subject in English..."
                                value={newTemplateSubjectEN}
                                onChange={(e) =>
                                  setNewTemplateSubjectEN(e.target.value)
                                }
                              />
                            </Box>
                            <Box>
                              <Text mb={2} fontWeight="medium">
                                Content (EN)
                              </Text>
                              <RichTextEditor
                                value={newTemplateContentEN}
                                onChange={setNewTemplateContentEN}
                                placeholder="Enter your English email template content here..."
                                minHeight="200px"
                              />
                            </Box>
                          </VStack>
                        </TabPanel>
                        <TabPanel px={0}>
                          <VStack spacing={3} align="stretch">
                            <Box>
                              <Text mb={2} fontWeight="medium">
                                Subject (FR)
                              </Text>
                              <Input
                                placeholder="Sujet de l'email en français..."
                                value={newTemplateSubjectFR}
                                onChange={(e) =>
                                  setNewTemplateSubjectFR(e.target.value)
                                }
                              />
                            </Box>
                            <Box>
                              <Text mb={2} fontWeight="medium">
                                Content (FR)
                              </Text>
                              <RichTextEditor
                                value={newTemplateContentFR}
                                onChange={setNewTemplateContentFR}
                                placeholder="Entrez le contenu de votre modèle d'email en français ici..."
                                minHeight="200px"
                              />
                            </Box>
                          </VStack>
                        </TabPanel>
                      </TabPanels>
                    </Tabs>
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={onCreateClose}>
                    Cancel
                  </Button>
                  <Button colorScheme="blue" onClick={handleCreateTemplate}>
                    Create Template
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            {/* Edit Template Modal */}
            <Modal
              isOpen={isEditOpen}
              onClose={onEditClose}
              size="xl"
              closeOnOverlayClick={false}
            >
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Edit Email Template</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text mb={2} fontWeight="medium">
                        Template Name
                      </Text>
                      <Input
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                      />
                    </Box>
                    <Tabs>
                      <TabList>
                        <Tab>English (EN)</Tab>
                        <Tab>Français (FR)</Tab>
                      </TabList>
                      <TabPanels>
                        <TabPanel px={0}>
                          <VStack spacing={3} align="stretch">
                            <Box>
                              <Text mb={2} fontWeight="medium">
                                Subject (EN)
                              </Text>
                              <Input
                                placeholder="Email subject in English..."
                                value={newTemplateSubjectEN}
                                onChange={(e) =>
                                  setNewTemplateSubjectEN(e.target.value)
                                }
                              />
                            </Box>
                            <Box>
                              <HStack justify="space-between" mb={2}>
                                <Text fontWeight="medium">Content (EN)</Text>
                                <Button
                                  leftIcon={<MdAutoFixHigh />}
                                  size="xs"
                                  colorScheme="purple"
                                  variant="outline"
                                  onClick={() => {
                                    setFixingLanguage('EN');
                                    handleFixTemplate();
                                  }}
                                  isLoading={
                                    isFixing && fixingLanguage === 'EN'
                                  }
                                  loadingText="Fixing..."
                                >
                                  Fix with AI
                                </Button>
                              </HStack>
                              <RichTextEditor
                                value={newTemplateContentEN}
                                onChange={setNewTemplateContentEN}
                                placeholder="Enter your English email template content here..."
                                minHeight="200px"
                              />
                            </Box>
                          </VStack>
                        </TabPanel>
                        <TabPanel px={0}>
                          <VStack spacing={3} align="stretch">
                            <Box>
                              <Text mb={2} fontWeight="medium">
                                Subject (FR)
                              </Text>
                              <Input
                                placeholder="Sujet de l'email en français..."
                                value={newTemplateSubjectFR}
                                onChange={(e) =>
                                  setNewTemplateSubjectFR(e.target.value)
                                }
                              />
                            </Box>
                            <Box>
                              <HStack justify="space-between" mb={2}>
                                <Text fontWeight="medium">Content (FR)</Text>
                                <Button
                                  leftIcon={<MdAutoFixHigh />}
                                  size="xs"
                                  colorScheme="purple"
                                  variant="outline"
                                  onClick={() => {
                                    setFixingLanguage('FR');
                                    handleFixTemplate();
                                  }}
                                  isLoading={
                                    isFixing && fixingLanguage === 'FR'
                                  }
                                  loadingText="Fixing..."
                                >
                                  Fix with AI
                                </Button>
                              </HStack>
                              <RichTextEditor
                                value={newTemplateContentFR}
                                onChange={setNewTemplateContentFR}
                                placeholder="Entrez le contenu de votre modèle d'email en français ici..."
                                minHeight="200px"
                              />
                            </Box>
                          </VStack>
                        </TabPanel>
                      </TabPanels>
                    </Tabs>
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={onEditClose}>
                    Cancel
                  </Button>
                  <Button colorScheme="blue" onClick={handleEditTemplate}>
                    Save Changes
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
              isOpen={isDeleteOpen}
              leastDestructiveRef={deleteRef}
              onClose={onDeleteClose}
              isCentered
            >
              <AlertDialogOverlay>
                <AlertDialogContent>
                  <AlertDialogHeader fontSize="lg" fontWeight="bold">
                    Delete Template
                  </AlertDialogHeader>
                  <AlertDialogBody>
                    Are you sure you want to delete this template? This action
                    cannot be undone.
                  </AlertDialogBody>
                  <AlertDialogFooter>
                    <Button ref={deleteRef} onClick={onDeleteClose}>
                      Cancel
                    </Button>
                    <Button
                      colorScheme="red"
                      ml={3}
                      onClick={() => {
                        if (templateToDelete) {
                          handleDeleteTemplate(templateToDelete);
                        }
                        onDeleteClose();
                      }}
                    >
                      Delete
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialogOverlay>
            </AlertDialog>
          </VStack>
        </TabPanel>
        <TabPanel px={0} pt={4}>
          <VStack spacing={4} align="stretch" w="100%">
            {/* Top row: equal-height left/right columns */}
            <HStack alignItems="stretch" spacing={4} w="100%">
              {/* LEFT: Customer Message */}
              <Box w="50%" display="flex" flexDirection="column">
                <SectionCard
                  flex={1}
                  icon={<MdSearch size={18} />}
                  title="Customer Message"
                  subtitle="Paste the customer's inquiry below"
                  contentProps={{
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <Textarea
                    flex={1}
                    minH="180px"
                    value={ragQuery}
                    onChange={(e) => setRagQuery(e.target.value)}
                    placeholder="Paste the customer's email or message here..."
                    resize="none"
                    fontSize="sm"
                    _dark={{
                      bg: '#2a2a2a',
                      borderColor: '#464646',
                      color: 'gray.100',
                      _placeholder: { color: 'gray.600' },
                    }}
                  />
                  <Button
                    colorScheme="purple"
                    size="md"
                    onClick={handleGetSuggestions}
                    isLoading={isFetchingSuggestions}
                    loadingText="Searching..."
                    isDisabled={!ragQuery.trim()}
                    leftIcon={<MdAutoAwesome />}
                    w="100%"
                    flexShrink={0}
                  >
                    Get Suggestions
                  </Button>
                </SectionCard>
              </Box>

              {/* RIGHT: Suggested Replies */}
              <Box w="50%">
                <SectionCard
                  h="100%"
                  icon={<MdAutoAwesome size={18} />}
                  title="Suggested Replies"
                  contentProps={{ p: 4 }}
                >
                  {suggestions === null ? (
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      h="100%"
                      py={10}
                    >
                      <Box color="gray.200" _dark={{ color: 'gray.700' }}>
                        <MdAutoAwesome size={30} />
                      </Box>
                      <Text
                        mt={3}
                        fontSize="sm"
                        color="gray.400"
                        _dark={{ color: 'gray.600' }}
                        textAlign="center"
                        maxW="240px"
                      >
                        Suggestions will appear here after you submit a customer
                        message
                      </Text>
                    </Box>
                  ) : (
                    <VStack spacing={3} align="stretch">
                      {suggestions.map((suggestion, i) => {
                        const isSelected = selectedSuggestion === i;
                        return (
                          <Box
                            key={i}
                            p={3}
                            pr="56px"
                            position="relative"
                            borderRadius="10px"
                            border="2px solid"
                            borderColor={isSelected ? 'purple.400' : 'gray.200'}
                            bg="white"
                            _dark={{
                              borderColor: isSelected
                                ? 'purple.400'
                                : '#363636',
                              bg: '#242424',
                            }}
                            transition="border-color 0.15s"
                          >
                            <Box
                              fontSize="sm"
                              color="gray.800"
                              _dark={{ color: 'gray.100' }}
                              whiteSpace="pre-wrap"
                              lineHeight="1.65"
                              maxH="110px"
                              overflowY="auto"
                              sx={{
                                '&::-webkit-scrollbar': { width: '4px' },
                                '&::-webkit-scrollbar-thumb': {
                                  background: 'var(--chakra-colors-gray-300)',
                                  borderRadius: '4px',
                                },
                              }}
                            >
                              {suggestion}
                            </Box>
                            <Box
                              position="absolute"
                              top={2}
                              right={2}
                              display="flex"
                              flexDirection="column"
                              alignItems="flex-end"
                              gap={0.5}
                            >
                              {isSelected && (
                                <Text
                                  fontSize="xs"
                                  color="purple.500"
                                  _dark={{ color: 'purple.300' }}
                                  fontWeight="600"
                                  lineHeight="1"
                                >
                                  Copied
                                </Text>
                              )}
                              <IconButton
                                aria-label="Copy suggestion"
                                icon={<MdContentCopy size={13} />}
                                size="xs"
                                variant="ghost"
                                onClick={() =>
                                  handleCopySuggestion(suggestion, i)
                                }
                              />
                            </Box>
                          </Box>
                        );
                      })}
                    </VStack>
                  )}
                </SectionCard>
              </Box>
            </HStack>

            {/* Source Cases — full page width */}
            <SectionCard
              icon={<MdHistory size={18} />}
              title="Source Cases"
              subtitle="Past support cases used as context"
              contentProps={{ p: 4 }}
            >
              {sources.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  py={8}
                >
                  <Box color="gray.200" _dark={{ color: 'gray.700' }}>
                    <MdHistory size={26} />
                  </Box>
                  <Text
                    mt={3}
                    fontSize="sm"
                    color="gray.400"
                    _dark={{ color: 'gray.600' }}
                    textAlign="center"
                    maxW="220px"
                  >
                    Similar past cases will appear here
                  </Text>
                </Box>
              ) : (
                <Accordion allowMultiple>
                  {sources.map((source, idx) => (
                    <AccordionItem key={idx} border="none" mb={2}>
                      <AccordionButton
                        px={3}
                        py={2}
                        bg="gray.50"
                        borderRadius="8px"
                        _hover={{ bg: 'gray.100' }}
                        _dark={{ bg: '#2a2a2a', _hover: { bg: '#323232' } }}
                      >
                        <HStack flex={1} spacing={2} mr={2}>
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            flex={1}
                            textAlign="left"
                            noOfLines={1}
                            _dark={{ color: 'gray.100' }}
                          >
                            {source.subject}
                          </Text>
                          <Badge
                            colorScheme={
                              source.score >= 0.8
                                ? 'green'
                                : source.score >= 0.6
                                  ? 'yellow'
                                  : 'orange'
                            }
                            fontSize="xs"
                          >
                            {Math.round(source.score * 100)}% match
                          </Badge>
                          <Text fontSize="xs" color="gray.500">
                            {formatSourceDate(source.date)}
                          </Text>
                        </HStack>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel px={3} pt={3} pb={2}>
                        <HStack align="flex-start" spacing={4}>
                          <Box flex={1}>
                            <Text
                              fontSize="xs"
                              fontWeight="600"
                              color="gray.500"
                              _dark={{ color: 'gray.400' }}
                              mb={1}
                            >
                              Customer
                            </Text>
                            <Box
                              p={2}
                              bg="gray.50"
                              borderRadius="6px"
                              fontSize="xs"
                              color="gray.700"
                              lineHeight="1.5"
                              _dark={{ bg: '#2a2a2a', color: 'gray.300' }}
                            >
                              {source.customerText}
                            </Box>
                          </Box>
                          <Box flex={1}>
                            <Text
                              fontSize="xs"
                              fontWeight="600"
                              color="gray.500"
                              _dark={{ color: 'gray.400' }}
                              mb={1}
                            >
                              Reply
                            </Text>
                            <Box
                              p={2}
                              bg="purple.50"
                              borderRadius="6px"
                              fontSize="xs"
                              color="gray.700"
                              lineHeight="1.5"
                              _dark={{ bg: '#262040', color: 'gray.300' }}
                            >
                              {source.agentText}
                            </Box>
                          </Box>
                        </HStack>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </SectionCard>
          </VStack>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

export default EmailAutomationComponent;
