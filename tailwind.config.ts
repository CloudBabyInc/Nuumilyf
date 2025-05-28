
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '1rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'caslon': ['Libre Caslon Condensed', 'Georgia', 'Times New Roman', 'serif'],
				'serif': ['Libre Caslon Condensed', 'Georgia', 'Times New Roman', 'serif'],
				'sans': ['Libre Caslon Condensed', 'Georgia', 'Times New Roman', 'serif'],
			},
			fontWeight: {
				'extralight': '200',
				'light': '300',
				'normal': '400',
				'medium': '500',
				'semibold': '600',
				'bold': '700',
				'extrabold': '800',
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				nuumi: {
					pink: '#FF69B4',
					'light-pink': '#FFC0CB',
					'dark-pink': '#FF1493',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				pulse: {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.7' }
				},
				shimmer: {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(8px)', filter: 'blur(4px)' },
					'100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0px)' }
				},
				'fade-in-up': {
					'0%': { opacity: '0', transform: 'translateY(15px)', filter: 'blur(5px)' },
					'100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0px)' }
				},
				'fade-in-down': {
					'0%': { opacity: '0', transform: 'translateY(-15px)', filter: 'blur(5px)' },
					'100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0px)' }
				},
				'slide-in-left': {
					'0%': { opacity: '0', transform: 'translateX(-20px)', filter: 'blur(4px)' },
					'100%': { opacity: '1', transform: 'translateX(0)', filter: 'blur(0px)' }
				},
				'slide-in-right': {
					'0%': { opacity: '0', transform: 'translateX(20px)', filter: 'blur(4px)' },
					'100%': { opacity: '1', transform: 'translateX(0)', filter: 'blur(0px)' }
				},
				'scale-in': {
					'0%': { opacity: '0', transform: 'scale(0.95)', filter: 'blur(3px)' },
					'100%': { opacity: '1', transform: 'scale(1)', filter: 'blur(0px)' }
				},
				'bounce-in': {
					'0%': { opacity: '0', transform: 'scale(0.9)', filter: 'blur(4px)' },
					'50%': { opacity: '1', transform: 'scale(1.01)', filter: 'blur(1px)' },
					'70%': { transform: 'scale(0.99)', filter: 'blur(0px)' },
					'100%': { opacity: '1', transform: 'scale(1)', filter: 'blur(0px)' }
				},
				'glow': {
					'0%, 100%': { boxShadow: '0 0 0px rgba(233, 75, 157, 0)', filter: 'blur(0px)' },
					'50%': { boxShadow: '0 0 15px rgba(233, 75, 157, 0.4)', filter: 'blur(0px)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)', filter: 'blur(0px)' },
					'50%': { transform: 'translateY(-3px)', filter: 'blur(0px)' }
				},
				'text-shimmer': {
					'0%': { backgroundPosition: '-200% center' },
					'100%': { backgroundPosition: '200% center' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				pulse: 'pulse 1.5s ease-in-out infinite',
				shimmer: 'shimmer 2s infinite linear',
				'fade-in': 'fade-in 0.6s ease-out',
				'fade-in-up': 'fade-in-up 0.8s ease-out',
				'fade-in-down': 'fade-in-down 0.8s ease-out',
				'slide-in-left': 'slide-in-left 0.7s ease-out',
				'slide-in-right': 'slide-in-right 0.7s ease-out',
				'scale-in': 'scale-in 0.5s ease-out',
				'bounce-in': 'bounce-in 0.8s ease-out',
				'glow': 'glow 2s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite',
				'text-shimmer': 'text-shimmer 3s ease-in-out infinite'
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		require("./src/utils/glassmorphismPlugin")
	],
} satisfies Config;
