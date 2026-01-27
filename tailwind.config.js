/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./packages/@wulin-master/*/src/**/*.{ts,js}",
    "./gems/wulin_master/app/views/**/*.html.haml",
    "./gems/wulin_master/app/helpers/**/*.rb",
    "./gems/wulin_master/app/assets/javascripts/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        'wulin-primary': 'var(--wulin-primary-color, #2196f3)',
        'wulin-secondary': 'var(--wulin-secondary-color, #ff4081)',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Important: avoid conflicts with Materialize CSS reset
  }
}
