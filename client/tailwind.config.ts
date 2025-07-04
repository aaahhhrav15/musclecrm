import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	safelist: [
		// Gradients
		'from-blue-500', 'to-blue-600',
		'from-green-500', 'to-green-600',
		'from-red-500', 'to-red-600',
		'from-orange-500', 'to-orange-600',
		'from-emerald-500', 'to-emerald-600',
		'from-purple-500', 'to-purple-600',
		'from-pink-500', 'to-pink-600',
		'from-indigo-500', 'to-indigo-600',
		'from-yellow-500', 'to-yellow-600',
		'from-amber-500', 'to-amber-600',
		'from-cyan-500', 'to-cyan-600',
		'from-teal-500', 'to-teal-600',
		'from-rose-500', 'to-rose-600',
		'from-violet-500', 'to-violet-600',
		'from-slate-500', 'to-slate-600',
		'from-lime-500', 'to-lime-600',
		'from-sky-500', 'to-sky-600',
		'from-gray-500', 'to-gray-600',
		// Icons
		'text-blue-600', 'text-green-600', 'text-red-600', 'text-orange-600',
		'text-emerald-600', 'text-purple-600', 'text-pink-600', 'text-indigo-600',
		'text-yellow-600', 'text-amber-600', 'text-cyan-600', 'text-teal-600',
		'text-rose-600', 'text-violet-600', 'text-slate-600', 'text-lime-600',
		'text-sky-600', 'text-gray-600',
		// Backgrounds
		'bg-blue-500/10', 'bg-green-500/10', 'bg-red-500/10', 'bg-orange-500/10',
		'bg-emerald-500/10', 'bg-purple-500/10', 'bg-pink-500/10', 'bg-indigo-500/10',
		'bg-yellow-500/10', 'bg-amber-500/10', 'bg-cyan-500/10', 'bg-teal-500/10',
		'bg-rose-500/10', 'bg-violet-500/10', 'bg-slate-500/10', 'bg-lime-500/10',
		'bg-sky-500/10', 'bg-gray-500/10',
	],
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
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
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
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Industry-specific colors
				gym: {
					DEFAULT: '#22c55e', // Green
					foreground: '#ffffff',
				},
				spa: {
					DEFAULT: '#06b6d4', // Teal
					foreground: '#ffffff',
				},
				hotel: {
					DEFAULT: '#eab308', // Gold
					foreground: '#ffffff',
				},
				club: {
					DEFAULT: '#a855f7', // Purple
					foreground: '#ffffff',
				},
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
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fade-out': {
					'0%': {
						opacity: '1',
						transform: 'translateY(0)'
					},
					'100%': {
						opacity: '0',
						transform: 'translateY(10px)'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
