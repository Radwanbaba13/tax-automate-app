import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  Box,
  Heading,
  Text,
  Textarea,
  Button,
  useToast,
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
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import {
  MdContentCopy,
  MdAdd,
  MdDelete,
  MdEdit,
  MdAutoFixHigh,
  MdAutoAwesome,
} from 'react-icons/md';
import Card from '../common/Card';

interface EmailTemplate {
  id: string;
  name: string;
  subjectEN: string;
  subjectFR: string;
  contentEN: string;
  contentFR: string;
  createdAt: string;
}

// Sparkle animation for AI button
const sparkle = keyframes`
  0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
  50% { opacity: 0.8; transform: scale(1.1) rotate(180deg); }
`;

function EmailAutomationComponent() {
  const toast = useToast();
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
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);

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
        toast({
          title: 'Error loading templates',
          description: error.message || 'Failed to load email templates',
          status: 'error',
          duration: 4000,
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
      (!newTemplateContentEN.trim() && !newTemplateContentFR.trim())
    ) {
      toast({
        title: 'Missing information',
        description: 'Please provide a name and at least one language content.',
        status: 'warning',
        duration: 3000,
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

        toast({
          title: 'Template created',
          description: 'Your email template has been created successfully.',
          status: 'success',
          duration: 3000,
        });
      } else {
        throw new Error(res?.error?.message || 'Failed to create template');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create template',
        status: 'error',
        duration: 4000,
      });
    }
  };

  const handleEditTemplate = async () => {
    if (
      !editingTemplate ||
      !newTemplateName.trim() ||
      (!newTemplateContentEN.trim() && !newTemplateContentFR.trim())
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

        toast({
          title: 'Template updated',
          description: 'Your email template has been updated successfully.',
          status: 'success',
          duration: 3000,
        });
      } else {
        throw new Error(res?.error?.message || 'Failed to update template');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update template',
        status: 'error',
        duration: 4000,
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

        toast({
          title: 'Template deleted',
          description: 'The template has been deleted.',
          status: 'info',
          duration: 3000,
        });
      } else {
        throw new Error(res?.error?.message || 'Failed to delete template');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete template',
        status: 'error',
        duration: 4000,
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
        toast({
          title: 'Template fixed',
          description: `Your ${fixingLanguage} template has been improved with AI.`,
          status: 'success',
          duration: 3000,
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
          'API quota exceeded. Please check your OpenAI billing and plan.';
      } else if (
        errorMessage.includes('401') ||
        errorMessage.includes('unauthorized')
      ) {
        userMessage =
          'Invalid API key. Please check your OpenAI API key configuration.';
      } else if (errorMessage.includes('rate limit')) {
        userMessage =
          'Rate limit exceeded. Please wait a moment and try again.';
      }

      toast({
        title: 'Error',
        description: userMessage,
        status: 'error',
        duration: 5000,
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
    if (!customerInquiry.trim()) {
      toast({
        title: 'Missing inquiry',
        description: 'Please enter a customer inquiry or email.',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (!responseText.trim()) {
      toast({
        title: 'Missing response',
        description: 'Please enter a response to refine.',
        status: 'warning',
        duration: 3000,
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
        const result = response.result || '';
        let emailContent = '';
        let extractedSubject = '';

        // Try to parse as JSON first
        try {
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            extractedSubject = parsed.subject || '';
            emailContent = parsed.body || parsed.content || '';
          }
        } catch {
          // Not JSON, try to extract subject from text format
          const subjectMatch = result.match(/Subject:\s*(.+?)(\n\n|\n|$)/i);
          if (subjectMatch) {
            extractedSubject = subjectMatch[1].trim();
            emailContent = result
              .replace(/Subject:\s*.+?(\n\n|\n|$)/i, '')
              .trim();
          } else {
            emailContent = result;
          }
        }

        // Set subject
        if (extractedSubject) {
          if (inquiryLanguage === 'EN') {
            setGeneratedSubjectEN(extractedSubject);
          } else {
            setGeneratedSubjectFR(extractedSubject);
          }
        }

        // Add professional signature block if not already present
        const signature = `\n\nSincerely,\n\nNawaf Sankari\n\nFiscal Specialist and Financial Security Advisor\n\nSankari Inc.\nFiscal and Financial Services\nwww.sankari.ca\ntaxdeclaration@gmail.com\n(514) 802-4776\n(514) 839-4776`;

        // Check if signature already exists
        if (!emailContent.includes('Nawaf Sankari')) {
          emailContent += signature;
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
          'API quota exceeded. Please check your OpenAI billing and plan.';
      } else if (
        errorMessage.includes('401') ||
        errorMessage.includes('unauthorized')
      ) {
        userMessage =
          'Invalid API key. Please check your OpenAI API key configuration.';
      } else if (errorMessage.includes('rate limit')) {
        userMessage =
          'Rate limit exceeded. Please wait a moment and try again.';
      }

      toast({
        title: 'Error',
        description: userMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyEmail = () => {
    const currentSubject =
      inquiryLanguage === 'EN' ? generatedSubjectEN : generatedSubjectFR;
    const fullEmail = currentSubject
      ? `Subject: ${currentSubject}\n\n${generatedEmail}`
      : generatedEmail;
    navigator.clipboard.writeText(fullEmail);
    toast({
      title: 'Copied!',
      description: 'Email content copied to clipboard.',
      status: 'success',
      duration: 2000,
    });
  };

  return (
    <VStack spacing={4} align="stretch" w="100%">
      <HStack spacing={4} align="stretch" w="100%">
        {/* Left Column - Email Generation */}
        <VStack spacing={4} flex={1} align="stretch">
          {/* Customer Inquiry Input */}
          <Card>
            <HStack justify="space-between" mb={4}>
              <Heading size="md" color="gray.700">
                Customer Inquiry / Email
              </Heading>
              <HStack spacing={2}>
                <Button
                  size="sm"
                  colorScheme={inquiryLanguage === 'EN' ? 'red' : 'gray'}
                  variant={inquiryLanguage === 'EN' ? 'solid' : 'outline'}
                  onClick={() => setInquiryLanguage('EN')}
                >
                  EN
                </Button>
                <Button
                  size="sm"
                  colorScheme={inquiryLanguage === 'FR' ? 'blue' : 'gray'}
                  variant={inquiryLanguage === 'FR' ? 'solid' : 'outline'}
                  onClick={() => setInquiryLanguage('FR')}
                >
                  FR
                </Button>
              </HStack>
            </HStack>
            <Textarea
              placeholder="Paste customer email or inquiry here..."
              value={customerInquiry}
              onChange={(e) => setCustomerInquiry(e.target.value)}
              minH="150px"
              resize="vertical"
            />
          </Card>

          {/* Response Input */}
          <Card>
            <HStack justify="space-between" mb={4}>
              <Heading size="md" color="gray.700">
                Your Response
              </Heading>
              <Button
                leftIcon={<MdContentCopy />}
                size="sm"
                onClick={() => {
                  const currentSubject =
                    inquiryLanguage === 'EN'
                      ? responseSubjectEN
                      : responseSubjectFR;
                  const fullResponse = currentSubject
                    ? `Subject: ${currentSubject}\n\n${responseText}`
                    : responseText;
                  navigator.clipboard.writeText(fullResponse);
                }}
                isDisabled={!responseText.trim()}
              >
                Copy
              </Button>
            </HStack>
            <VStack spacing={3} align="stretch">
              <Box>
                <Text mb={2} fontSize="sm" fontWeight="medium" color="gray.600">
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
                <Text mb={2} fontSize="sm" fontWeight="medium" color="gray.600">
                  Content
                </Text>
                <Textarea
                  placeholder="Type your response here, or click on a template to load it..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  minH="200px"
                  resize="vertical"
                />
              </Box>
            </VStack>
          </Card>

          {/* Refine with AI Button */}
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

          {/* Generated Email Output */}
          {generatedEmail && (
            <Card>
              <HStack justify="space-between" mb={4}>
                <Heading size="md" color="gray.700">
                  Generated Email
                </Heading>
                <Button
                  leftIcon={<MdContentCopy />}
                  size="sm"
                  onClick={handleCopyEmail}
                >
                  Copy to Clipboard
                </Button>
              </HStack>
              <VStack spacing={3} align="stretch">
                {(() => {
                  const currentSubject =
                    inquiryLanguage === 'EN'
                      ? generatedSubjectEN
                      : generatedSubjectFR;
                  return currentSubject ? (
                    <Box>
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color="gray.600"
                        mb={1}
                      >
                        Subject ({inquiryLanguage})
                      </Text>
                      <Box
                        p={3}
                        bg="gray.50"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="gray.200"
                        fontWeight="medium"
                      >
                        {currentSubject}
                      </Box>
                    </Box>
                  ) : null;
                })()}
                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color="gray.600"
                    mb={1}
                  >
                    Content
                  </Text>
                  <Box
                    p={4}
                    bg="white"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                    maxH="400px"
                    overflowY="auto"
                    fontSize="sm"
                    lineHeight="1.6"
                  >
                    {generatedEmail.split('\n').map((line, index) => {
                      const lineKey = `line-${index}-${line.substring(0, 10)}`;
                      // Format signature section
                      if (
                        line.includes('Sincerely,') ||
                        line.includes('Nawaf Sankari') ||
                        line.includes('Fiscal Specialist') ||
                        line.includes('Sankari Inc.') ||
                        line.includes('Fiscal and Financial') ||
                        line.includes('www.sankari.ca') ||
                        line.includes('taxdeclaration@gmail.com') ||
                        line.includes('(514)')
                      ) {
                        return (
                          <Text
                            key={lineKey}
                            fontSize={
                              line.includes('Nawaf Sankari') ? 'md' : 'sm'
                            }
                            fontWeight={
                              line.includes('Nawaf Sankari') ||
                              line.includes('Sankari Inc.')
                                ? 'bold'
                                : 'normal'
                            }
                            color={
                              line.includes('www.sankari.ca') ||
                              line.includes('taxdeclaration@gmail.com')
                                ? 'blue.600'
                                : 'gray.700'
                            }
                            mb={
                              line.includes('Sincerely,') ||
                              line.includes('Nawaf Sankari') ||
                              line.includes('Fiscal Specialist')
                                ? 2
                                : 0.5
                            }
                            fontStyle={
                              line.includes('Fiscal Specialist')
                                ? 'italic'
                                : 'normal'
                            }
                          >
                            {line}
                          </Text>
                        );
                      }
                      return (
                        <Text key={lineKey} mb={1} color="gray.700">
                          {line || '\u00A0'}
                        </Text>
                      );
                    })}
                  </Box>
                </Box>
              </VStack>
            </Card>
          )}
        </VStack>

        {/* Right Column - Templates */}
        <VStack spacing={4} flex={1} align="stretch">
          <Card>
            <HStack justify="space-between" mb={4}>
              <Heading size="md" color="gray.700">
                Email Templates
              </Heading>
              <Button
                leftIcon={<MdAdd />}
                size="sm"
                colorScheme="blue"
                onClick={onCreateOpen}
              >
                Create
              </Button>
            </HStack>

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
                  <Box py={8} textAlign="center" color="gray.500">
                    <Text>
                      {templateSearchQuery
                        ? 'No templates found matching your search.'
                        : 'No templates yet. Create your first template!'}
                    </Text>
                  </Box>
                );
              }

              return (
                <VStack
                  spacing={2}
                  align="stretch"
                  maxH="600px"
                  overflowY="auto"
                >
                  {filteredTemplates.map((template) => {
                    const hasEN = !!template.contentEN.trim();
                    const hasFR = !!template.contentFR.trim();
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
                        }}
                        onClick={() => handleTemplateClick(template)}
                        transition="all 0.2s"
                      >
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1} flex={1}>
                            <HStack>
                              <Text fontWeight="medium">{template.name}</Text>
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
                                >
                                  Subject ({inquiryLanguage}): {currentSubject}
                                </Text>
                              ) : null;
                            })()}
                            <Text fontSize="sm" color="gray.600" noOfLines={2}>
                              {(() => {
                                if (
                                  inquiryLanguage === 'EN' &&
                                  template.contentEN
                                ) {
                                  return template.contentEN.substring(0, 100);
                                }
                                if (template.contentFR) {
                                  return template.contentFR.substring(0, 100);
                                }
                                return template.contentEN.substring(0, 100);
                              })()}
                              ...
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
                              onClick={() => handleDeleteTemplate(template.id)}
                            />
                          </HStack>
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              );
            })()}
          </Card>
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
                        <Textarea
                          placeholder="Enter your English email template content here..."
                          value={newTemplateContentEN}
                          onChange={(e) =>
                            setNewTemplateContentEN(e.target.value)
                          }
                          minH="200px"
                          resize="vertical"
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
                        <Textarea
                          placeholder="Entrez le contenu de votre modèle d'email en français ici..."
                          value={newTemplateContentFR}
                          onChange={(e) =>
                            setNewTemplateContentFR(e.target.value)
                          }
                          minH="200px"
                          resize="vertical"
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
                            isLoading={isFixing && fixingLanguage === 'EN'}
                            loadingText="Fixing..."
                          >
                            Fix with AI
                          </Button>
                        </HStack>
                        <Textarea
                          value={newTemplateContentEN}
                          onChange={(e) =>
                            setNewTemplateContentEN(e.target.value)
                          }
                          minH="200px"
                          resize="vertical"
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
                            isLoading={isFixing && fixingLanguage === 'FR'}
                            loadingText="Fixing..."
                          >
                            Fix with AI
                          </Button>
                        </HStack>
                        <Textarea
                          value={newTemplateContentFR}
                          onChange={(e) =>
                            setNewTemplateContentFR(e.target.value)
                          }
                          minH="200px"
                          resize="vertical"
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
    </VStack>
  );
}

export default EmailAutomationComponent;
