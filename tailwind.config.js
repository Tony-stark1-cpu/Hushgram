/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
        },
        "discord-dark": "#2f3136",
        "discord-secondary": "#36393f",
        "discord-accent": "#5865f2",
        "discord-accent-hover": "#4752c4",
        "discord-text": "#b9bbbe",
        "discord-border": "#40444b",
        "discord-hover": "#32353b",
        "discord-selected": "#393c43",
        "discord-success": "#3ba55c",
        "discord-warning": "#faa61a",
        "discord-danger": "#ed4245",
      },
      borderRadius: {
        container: "0.75rem",
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(88, 101, 242, 0.3)',
        'glow-lg': '0 0 40px rgba(88, 101, 242, 0.4)',
      },
    },
  },
  plugins: [],
};
