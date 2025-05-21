/**
 * Tailwind CSS plugin for advanced glassmorphism effects
 */

const plugin = require('tailwindcss/plugin');

const glassmorphismPlugin = plugin(function({ addComponents, theme }) {
  const glassmorphism = {
    '.glass-base': {
      'background': 'rgba(255, 255, 255, 0.08)',
      'backdrop-filter': 'blur(10px)',
      '-webkit-backdrop-filter': 'blur(10px)',
      'border': '1px solid rgba(255, 255, 255, 0.18)',
      'border-radius': '12px',
      'box-shadow': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    },
    '.glass-intense': {
      'background': 'rgba(255, 255, 255, 0.05)',
      'backdrop-filter': 'blur(16px)',
      '-webkit-backdrop-filter': 'blur(16px)',
      'border': '1px solid rgba(255, 255, 255, 0.1)',
      'border-radius': '12px',
      'box-shadow': `
        0 4px 6px rgba(0, 0, 0, 0.1),
        0 1px 3px rgba(0, 0, 0, 0.08),
        0 8px 32px rgba(31, 38, 135, 0.2),
        inset 0 0 0 1px rgba(255, 255, 255, 0.08)
      `,
    },
    '.glass-gradient': {
      'position': 'relative',
      'background': 'rgba(255, 255, 255, 0.05)',
      'backdrop-filter': 'blur(16px)',
      '-webkit-backdrop-filter': 'blur(16px)',
      'border-radius': '12px',
      'overflow': 'hidden',
      'box-shadow': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      '&::before': {
        'content': '""',
        'position': 'absolute',
        'top': '0',
        'left': '-50%',
        'width': '200%',
        'height': '100%',
        'background': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
        'transform': 'skewX(45deg)',
        'transition': '0.5s',
        'pointer-events': 'none',
      }
    },
    '.glass-card': {
      'background': 'rgba(255, 255, 255, 0.07)',
      'backdrop-filter': 'blur(10px)',
      '-webkit-backdrop-filter': 'blur(10px)',
      'border': '1px solid rgba(255, 255, 255, 0.1)',
      'border-radius': '16px',
      'padding': '20px',
      'box-shadow': `
        0 4px 6px rgba(0, 0, 0, 0.1),
        0 1px 3px rgba(0, 0, 0, 0.08),
        0 8px 32px rgba(31, 38, 135, 0.2)
      `,
      'transition': 'transform 0.3s ease, box-shadow 0.3s ease',
      '&:hover': {
        'transform': 'translateY(-5px)',
        'box-shadow': `
          0 7px 14px rgba(0, 0, 0, 0.12),
          0 3px 6px rgba(0, 0, 0, 0.1),
          0 12px 40px rgba(31, 38, 135, 0.25)
        `,
      }
    },
    '.glass-glow': {
      'position': 'relative',
      'background': 'rgba(255, 255, 255, 0.05)',
      'backdrop-filter': 'blur(16px)',
      '-webkit-backdrop-filter': 'blur(16px)',
      'border-radius': '12px',
      'overflow': 'hidden',
      'box-shadow': `
        0 8px 32px 0 rgba(31, 38, 135, 0.37),
        0 0 10px 2px rgba(255, 255, 255, 0.1)
      `,
      '&::after': {
        'content': '""',
        'position': 'absolute',
        'top': '0',
        'left': '0',
        'right': '0',
        'bottom': '0',
        'border-radius': '12px',
        'box-shadow': 'inset 0 0 20px rgba(255, 255, 255, 0.2)',
        'z-index': '1',
        'pointer-events': 'none',
      }
    },
    '.glass-button': {
      'background': 'rgba(255, 255, 255, 0.1)',
      'backdrop-filter': 'blur(10px)',
      '-webkit-backdrop-filter': 'blur(10px)',
      'border': '1px solid rgba(255, 255, 255, 0.2)',
      'border-radius': '8px',
      'padding': '10px 20px',
      'color': 'white',
      'font-weight': '500',
      'text-shadow': '0 1px 2px rgba(0, 0, 0, 0.2)',
      'box-shadow': `
        0 4px 6px rgba(0, 0, 0, 0.1),
        0 1px 3px rgba(0, 0, 0, 0.08)
      `,
      'transition': 'all 0.3s ease',
      '&:hover': {
        'background': 'rgba(255, 255, 255, 0.15)',
        'box-shadow': `
          0 7px 14px rgba(0, 0, 0, 0.12),
          0 3px 6px rgba(0, 0, 0, 0.1)
        `,
        'transform': 'translateY(-2px)',
      },
      '&:active': {
        'transform': 'translateY(1px)',
        'box-shadow': `
          0 3px 4px rgba(0, 0, 0, 0.1),
          0 1px 2px rgba(0, 0, 0, 0.08)
        `,
      }
    },
    '.glass-container': {
      'background': 'rgba(255, 255, 255, 0.05)',
      'backdrop-filter': 'blur(16px)',
      '-webkit-backdrop-filter': 'blur(16px)',
      'border': '1px solid rgba(255, 255, 255, 0.1)',
      'border-radius': '16px',
      'padding': '30px',
      'box-shadow': `
        0 8px 32px 0 rgba(31, 38, 135, 0.37),
        inset 0 0 0 1px rgba(255, 255, 255, 0.08)
      `,
    }
  };

  addComponents(glassmorphism);
});

module.exports = glassmorphismPlugin;
