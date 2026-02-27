/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#1e1e1e',
                primary: '#3b82f6', // Focus Blue
            }
        },
    },
    plugins: [],
}
