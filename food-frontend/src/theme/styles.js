export const getThemeStyles = (darkMode) => ({
    bgMain: darkMode ? 'bg-[#0d110d]' : 'bg-[#f5faf4]',
    cardBg: darkMode ? 'bg-[#1a1c1a]' : 'bg-white',
    cardBgGlass: darkMode ? 'bg-[#1a1c1a]/90' : 'bg-white/90',
    panelBg: darkMode ? 'bg-[#121212]' : 'bg-[#fdfdfc]',
    leftPanelBg: 'bg-[#2d5a27]',
    border: darkMode ? 'border-white/10' : 'border-[#ddd8ce]',
    textMain: darkMode ? 'text-white' : 'text-[#2d5a27]',
    textSub: darkMode ? 'text-white/60' : 'text-[#5a7054]',
    accentText: 'text-[#2d5a27]',
    accentBg: 'bg-[#2d5a27]',
    inputBg: darkMode ? 'bg-white/5' : 'bg-white',
    optionStyles: darkMode ? 'bg-[#1a1c1a] text-white' : 'bg-white text-[#2d5a27]',
});
