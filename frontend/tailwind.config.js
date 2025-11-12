/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Trusted Leaf - for verified claims
        'verified': '#7da861',
        'verified-bg': '#B0DC87',
        
        // Hello Yellow - for questionable claims
        'questionable': '#c9a836',
        'questionable-bg': '#F3E788',
        
        // Concerned Coral - for disputed claims
        'disputed': '#c66363',
        'disputed-bg': '#DF8D8D',
        
        // Explorer Blue - primary action color
        'primary': '#4d9ae3',
        'primary-hover': '#3d7db8',
      },
    },
  },
  plugins: [],
}
