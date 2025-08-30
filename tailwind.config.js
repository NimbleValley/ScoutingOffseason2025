module.exports = {
  theme: {
    extend: {
      keyframes: {
        'pulse-scale': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
        },
      },
      animation: {
        'pulse-scale': 'pulse-scale 1s ease-in-out infinite',
      },
    },
  },
};
