/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: This points to where you write code
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        urbis: {
          // The primary Teal/Green from the RenterNest design
          primary: '#0D9488', 
          secondary: '#115E59',
          bg: '#FFFFFF',
          surface: '#F5F5F5', // Light gray for cards [cite: 36]
          text: '#1A1A1A',
          muted: '#9CA3AF',
        },
      },
      fontFamily: {
        // We will map these to the loaded fonts shortly
        sans: ['Urbanist_400Regular'],
        medium: ['Urbanist_500Medium'],
        semibold: ['Urbanist_600SemiBold'], // Used for Headers [cite: 22]
        bold: ['Urbanist_700Bold'],         // Used for CTAs [cite: 22]
      },
    },
  },
  plugins: [],
}