import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ColorTheme, colorThemes } from '@/components/settings/ThemeSelector';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ColorTheme;
  mode: ThemeMode;
  setTheme: (theme: ColorTheme) => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleMode: () => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'default',
  mode: 'light',
  setTheme: async () => {},
  setMode: async () => {},
  toggleMode: async () => {},
  isLoading: true,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<ColorTheme>('default');
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from database on initial render
  useEffect(() => {
    const loadTheme = async () => {
      try {
        setIsLoading(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Get user settings
        const { data, error } = await supabase
          .from('user_settings')
          .select('color_theme, dark_mode')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No settings found, create default settings
            const { error: insertError } = await supabase
              .from('user_settings')
              .insert({
                user_id: user.id,
                color_theme: 'default',
                dark_mode: false,
                notifications_enabled: true,
                privacy_mode: false
              });

            if (insertError) {
              console.error('Error creating default settings:', insertError);
            }
          } else {
            console.error('Error fetching theme:', error);
          }
        } else {
          if (data?.color_theme) {
            setThemeState(data.color_theme as ColorTheme);
          }

          if (data?.dark_mode !== undefined) {
            setModeState(data.dark_mode ? 'dark' : 'light');
          }
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme, mode);
  }, [theme, mode]);

  // Function to apply theme to CSS variables
  const applyTheme = (theme: ColorTheme, mode: ThemeMode) => {
    const root = document.documentElement;
    const themeColors = colorThemes[theme];

    // Set colors based on mode
    const primaryColor = mode === 'light' ? themeColors.primary.light : themeColors.primary.dark;
    const secondaryColor = mode === 'light' ? themeColors.secondary.light : themeColors.secondary.dark;
    const backgroundColor = mode === 'light' ? themeColors.background.light : themeColors.background.dark;
    const foregroundColor = mode === 'light' ? themeColors.foreground.light : themeColors.foreground.dark;

    // Apply background color directly
    document.body.style.backgroundColor = backgroundColor;

    // Set theme colors
    root.style.setProperty('--nuumi-pink', primaryColor);
    root.style.setProperty('--nuumi-secondary', secondaryColor);

    // Set derived colors
    root.style.setProperty('--nuumi-pink-light', addAlpha(primaryColor, 0.2)); // 20% opacity
    root.style.setProperty('--nuumi-pink-medium', addAlpha(primaryColor, 0.4)); // 40% opacity
    root.style.setProperty('--nuumi-pink-dark', adjustColorBrightness(primaryColor, -20));

    // Set background and foreground colors
    if (mode === 'dark') {
      root.classList.add('dark-mode');

      // Update dark mode specific colors with improved contrast
      root.style.setProperty('--background', '0 0% 10%'); // Slightly lighter for better readability
      root.style.setProperty('--foreground', '0 0% 98%');
      root.style.setProperty('--card', '0 0% 13%'); // Slightly lighter card background
      root.style.setProperty('--card-foreground', '0 0% 98%');
      root.style.setProperty('--popover', '0 0% 13%');
      root.style.setProperty('--popover-foreground', '0 0% 98%');
      root.style.setProperty('--muted', '0 0% 18%'); // Slightly lighter muted background
      root.style.setProperty('--muted-foreground', '0 0% 80%'); // Increased contrast for muted text
      root.style.setProperty('--border', '0 0% 25%'); // More visible borders
      root.style.setProperty('--input', '0 0% 18%');

      // Add overlay and hover colors for dark mode with improved visibility
      root.style.setProperty('--overlay', 'rgba(255, 255, 255, 0.15)'); // Increased opacity
      root.style.setProperty('--hover', 'rgba(255, 255, 255, 0.1)'); // Increased opacity
      root.style.setProperty('--hover-light', 'rgba(255, 255, 255, 0.07)'); // Increased opacity

      // Add focus state for accessibility
      root.style.setProperty('--focus-ring', 'rgba(255, 255, 255, 0.5)');
    } else {
      root.classList.remove('dark-mode');

      // Get HSL values from the primary color and background color
      const hslValues = hexToHSL(primaryColor);
      const bgHslValues = hexToHSL(backgroundColor);

      if (hslValues && bgHslValues) {
        // Use the background color's hue with very subtle saturation
        const bgHue = bgHslValues.h;
        const bgSaturation = bgHslValues.s;
        const cardSaturation = Math.max(2, bgHslValues.s - 1); // Slightly less saturated for cards

        // Update light mode specific colors with theme-based hues and improved contrast
        root.style.setProperty('--background', `${bgHue} ${bgSaturation}% ${bgHslValues.l}%`);
        root.style.setProperty('--foreground', '0 0% 3.9%');
        root.style.setProperty('--card', `${bgHue} ${cardSaturation}% ${bgHslValues.l}%`);
        root.style.setProperty('--card-foreground', '0 0% 3.9%');
        root.style.setProperty('--popover', `${bgHue} ${cardSaturation}% ${bgHslValues.l}%`);
        root.style.setProperty('--popover-foreground', '0 0% 3.9%');
        root.style.setProperty('--muted', `${bgHue} ${bgSaturation}% 94%`); // Slightly darker for better contrast
        root.style.setProperty('--muted-foreground', '0 0% 35%'); // Darker for better contrast (was 45.1%)
        root.style.setProperty('--border', `${bgHue} ${bgSaturation}% 85%`); // Darker border for better visibility
        root.style.setProperty('--input', `${bgHue} ${bgSaturation}% 85%`); // Darker input for better visibility

        // Create theme-colored overlays with improved opacity for better visibility
        const overlayR = parseInt(primaryColor.substring(1, 3), 16);
        const overlayG = parseInt(primaryColor.substring(3, 5), 16);
        const overlayB = parseInt(primaryColor.substring(5, 7), 16);

        // Add overlay and hover colors for light mode with improved visibility
        root.style.setProperty('--overlay', `rgba(${overlayR}, ${overlayG}, ${overlayB}, 0.1)`); // Increased opacity
        root.style.setProperty('--hover', `rgba(${overlayR}, ${overlayG}, ${overlayB}, 0.07)`); // Increased opacity
        root.style.setProperty('--hover-light', `rgba(${overlayR}, ${overlayG}, ${overlayB}, 0.05)`); // Increased opacity

        // Add focus state for accessibility
        root.style.setProperty('--focus-ring', `rgba(${overlayR}, ${overlayG}, ${overlayB}, 0.5)`);
      } else {
        // Fallback to neutral colors if HSL conversion fails, with improved contrast
        root.style.setProperty('--background', '0 0% 100%');
        root.style.setProperty('--foreground', '0 0% 3.9%');
        root.style.setProperty('--card', '0 0% 100%');
        root.style.setProperty('--card-foreground', '0 0% 3.9%');
        root.style.setProperty('--popover', '0 0% 100%');
        root.style.setProperty('--popover-foreground', '0 0% 3.9%');
        root.style.setProperty('--muted', '0 0% 94%'); // Slightly darker for better contrast
        root.style.setProperty('--muted-foreground', '0 0% 35%'); // Darker for better contrast
        root.style.setProperty('--border', '0 0% 85%'); // Darker border for better visibility
        root.style.setProperty('--input', '0 0% 85%'); // Darker input for better visibility

        // Add overlay and hover colors for light mode with improved visibility
        root.style.setProperty('--overlay', 'rgba(0, 0, 0, 0.1)'); // Increased opacity
        root.style.setProperty('--hover', 'rgba(0, 0, 0, 0.07)'); // Increased opacity
        root.style.setProperty('--hover-light', 'rgba(0, 0, 0, 0.05)'); // Increased opacity

        // Add focus state for accessibility
        root.style.setProperty('--focus-ring', 'rgba(0, 0, 0, 0.3)');
      }
    }

    // Update primary and accent colors based on the theme with improved contrast
    const hslValues = hexToHSL(primaryColor);
    if (hslValues) {
      // Set primary and accent colors
      root.style.setProperty('--primary', `${hslValues.h} ${hslValues.s}% ${hslValues.l}%`);
      root.style.setProperty('--accent', `${hslValues.h} ${hslValues.s}% ${hslValues.l}%`);

      // Set ring color to match theme
      root.style.setProperty('--ring', `${hslValues.h} ${hslValues.s}% ${hslValues.l}%`);

      // Add theme colors to other UI elements with improved contrast
      if (mode === 'light') {
        // Create a more visible secondary color based on the primary
        const secondarySaturation = Math.min(25, hslValues.s * 0.3); // Increased saturation
        const secondaryLightness = 94; // Slightly darker for better contrast
        root.style.setProperty('--secondary', `${hslValues.h} ${secondarySaturation}% ${secondaryLightness}%`);
        root.style.setProperty('--secondary-foreground', `${hslValues.h} ${hslValues.s}% 25%`); // Darker for better contrast

        // Create a more visible destructive color that harmonizes with the theme
        const destructiveHue = (hslValues.h + 180) % 360; // Complementary color
        root.style.setProperty('--destructive', `${destructiveHue} 85% 55%`); // Slightly darker for better contrast
      } else {
        // Dark mode secondary colors with improved contrast
        const secondarySaturation = Math.min(30, hslValues.s * 0.4);
        const secondaryLightness = 20; // Dark but not too dark
        root.style.setProperty('--secondary', `${hslValues.h} ${secondarySaturation}% ${secondaryLightness}%`);
        root.style.setProperty('--secondary-foreground', `${hslValues.h} 15% 85%`); // Light text on dark background

        // Create a visible destructive color for dark mode
        const destructiveHue = (hslValues.h + 180) % 360; // Complementary color
        root.style.setProperty('--destructive', `${destructiveHue} 90% 65%`); // Brighter for dark mode
      }

      // Add interactive element states for better accessibility
      const interactiveHue = hslValues.h;
      const interactiveSaturation = Math.min(90, hslValues.s * 1.2);

      // Focus visible state for keyboard navigation
      root.style.setProperty('--focus-visible', `${interactiveHue} ${interactiveSaturation}% 50%`);

      // Active state for buttons and interactive elements
      if (mode === 'light') {
        root.style.setProperty('--active', `${interactiveHue} ${interactiveSaturation}% 40%`);
      } else {
        root.style.setProperty('--active', `${interactiveHue} ${interactiveSaturation}% 60%`);
      }
    }

    // Update theme-color meta tag for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', primaryColor);
    }
  };

  // Helper function to convert hex to HSL
  const hexToHSL = (hex: string): { h: number, s: number, l: number } | null => {
    try {
      // Convert hex to RGB
      const r = parseInt(hex.substring(1, 3), 16) / 255;
      const g = parseInt(hex.substring(3, 5), 16) / 255;
      const b = parseInt(hex.substring(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }

        h = Math.round(h * 60);
      }

      s = Math.round(s * 100);
      l = Math.round(l * 100);

      return { h, s, l };
    } catch (error) {
      console.error('Error converting hex to HSL:', error);
      return null;
    }
  };

  // Helper function to add alpha to a hex color
  const addAlpha = (hex: string, alpha: number): string => {
    try {
      // Convert hex to RGB
      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);

      // Return RGBA
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (error) {
      console.error('Error adding alpha to color:', error);
      return hex;
    }
  };

  // Helper function to darken/lighten colors
  const adjustColorBrightness = (hex: string, percent: number): string => {
    try {
      // Convert hex to RGB
      let r = parseInt(hex.substring(1, 3), 16);
      let g = parseInt(hex.substring(3, 5), 16);
      let b = parseInt(hex.substring(5, 7), 16);

      // Adjust brightness
      r = Math.max(0, Math.min(255, r + percent));
      g = Math.max(0, Math.min(255, g + percent));
      b = Math.max(0, Math.min(255, b + percent));

      // Convert back to hex
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (error) {
      console.error('Error adjusting color brightness:', error);
      return hex;
    }
  };

  // Function to update theme in database and state
  const setTheme = async (newTheme: ColorTheme) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update in database
      const { error } = await supabase
        .from('user_settings')
        .update({ color_theme: newTheme })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating theme:', error);
        return;
      }

      // Update state
      setThemeState(newTheme);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  };

  // Function to update mode in database and state
  const setMode = async (newMode: ThemeMode) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update in database
      const { error } = await supabase
        .from('user_settings')
        .update({ dark_mode: newMode === 'dark' })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating mode:', error);
        return;
      }

      // Update state
      setModeState(newMode);
    } catch (error) {
      console.error('Error setting mode:', error);
    }
  };

  // Function to toggle between light and dark mode
  const toggleMode = async () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    await setMode(newMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode, toggleMode, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
