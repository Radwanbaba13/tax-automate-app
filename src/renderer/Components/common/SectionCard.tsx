import React from 'react';
import { Box, HStack, Text, BoxProps } from '@chakra-ui/react';

interface SectionCardProps extends Omit<BoxProps, 'title'> {
  icon?: React.ReactElement;
  title: string;
  subtitle?: string;
  actions?: React.ReactElement;
  contentProps?: BoxProps;
  children?: React.ReactNode;
}

function SectionCard({
  icon,
  title,
  subtitle,
  actions,
  contentProps,
  children,
  ...boxProps
}: SectionCardProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      bg="white"
      borderRadius="12px"
      border="1px solid #edf2f7"
      boxShadow="0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)"
      overflow="hidden"
      {...boxProps}
    >
      {/* Header */}
      <HStack
        px={5}
        py="12px"
        justify="space-between"
        align="center"
        borderBottom="1px solid #edf2f7"
        flexShrink={0}
        bg="white"
      >
        <HStack spacing={3}>
          {icon && (
            <Box
              bg="#fff0f3"
              color="#cf3350"
              borderRadius="8px"
              p="10px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              {icon}
            </Box>
          )}
          <Box>
            <Text
              fontWeight="700"
              fontSize="18px"
              color="gray.700"
              lineHeight="1.3"
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                fontSize="11px"
                color="gray.400"
                fontWeight="500"
                lineHeight="1.3"
              >
                {subtitle}
              </Text>
            )}
          </Box>
        </HStack>
        {actions && <Box flexShrink={0}>{actions}</Box>}
      </HStack>

      {/* Content */}
      <Box flex={1} minH={0} {...contentProps}>
        {children}
      </Box>
    </Box>
  );
}

export default SectionCard;
