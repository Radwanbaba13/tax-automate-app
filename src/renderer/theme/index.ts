import {
  extendTheme,
  type ThemeConfig,
  type StyleFunctionProps,
} from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

// Color palette focused on red with minimal blue accents
const colors = {
  brand: {
    50: '#ffe5ea',
    100: '#fcb8c4',
    200: '#f78a9e',
    300: '#f35c77',
    400: '#ee2e51',
    500: '#cf3350', // Primary brand red
    600: '#a62840',
    700: '#7d1e30',
    800: '#54141f',
    900: '#2b0a10',
  },
  gray: {
    50: '#f9fafb',
    100: '#f1f1f1',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#414141',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const styles = {
  global: (props: StyleFunctionProps) => ({
    body: {
      // Light mode unchanged, dark mode uses a neutral dark gray
      bg: mode('gray.50', '#101010')(props),
      color: mode('gray.700', 'gray.100')(props),
    },
  }),
};

const fonts = {
  heading: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif`,
  body: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif`,
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: '500',
      borderRadius: 'md',
    },
    variants: {
      solid: {
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
          _disabled: {
            bg: 'brand.500',
          },
        },
        _active: {
          bg: 'brand.700',
        },
      },
      outline: {
        borderColor: 'brand.500',
        color: 'brand.500',
        _hover: {
          bg: 'brand.50',
        },
      },
      ghost: {
        color: 'gray.600',
        _hover: {
          bg: 'gray.100',
        },
        _dark: {
          color: 'gray.200',
          _hover: {
            bg: 'gray.700',
          },
        },
      },
    },
    defaultProps: {
      colorScheme: 'brand',
    },
  },
  Card: {
    baseStyle: {
      container: {
        bg: 'white',
        borderRadius: 'lg',
        boxShadow: 'sm',
        border: '1px solid',
        borderColor: 'gray.200',
        _dark: {
          bg: '#181818',
          borderColor: '#2a2a2a',
          boxShadow: 'none',
        },
      },
    },
  },
  Input: {
    variants: {
      outline: {
        field: {
          borderColor: 'gray.300',
          _hover: {
            borderColor: 'gray.400',
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px #cf3350',
          },
        },
      },
    },
    defaultProps: {
      focusBorderColor: 'brand.500',
    },
  },
  Select: {
    variants: {
      outline: {
        field: {
          borderColor: 'gray.300',
          _hover: {
            borderColor: 'gray.400',
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px #cf3350',
          },
        },
      },
    },
    defaultProps: {
      focusBorderColor: 'brand.500',
    },
  },
  Checkbox: {
    baseStyle: {
      control: {
        _checked: {
          bg: 'brand.500',
          borderColor: 'brand.500',
          _hover: {
            bg: 'brand.600',
            borderColor: 'brand.600',
          },
        },
      },
    },
    defaultProps: {
      colorScheme: 'brand',
    },
  },
};

const shadows = {
  outline: '0 0 0 3px rgba(207, 51, 80, 0.1)',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

const radii = {
  none: '0',
  sm: '0.25rem',
  base: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.25rem',
  '3xl': '1.5rem',
  full: '9999px',
};

const theme = extendTheme({
  config,
  colors,
  fonts,
  styles,
  components,
  shadows,
  radii,
});

export default theme;
