/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				'foreground': '#F8F8F2',
				'background': '#282A36',
				'primary': '#BD93F9',
				'secondary': '#6272A4',
				'accent': '#FF79C6',
			},
      fontSize: {
        sm: '0.750rem',
        base: '1rem',
        xl: '1.333rem',
        '2xl': '1.777rem',
        '3xl': '2.369rem',
        '4xl': '3.158rem',
        '5xl': '4.210rem',
      },
      fontFamily: {
        heading: 'Montserrat',
        body: 'Nanum Gothic',
      },
      fontWeight: {
        normal: '400',
        bold: '700',
      },
		},
	},
	plugins: [
    require('@tailwindcss/typography')
  ],
}
