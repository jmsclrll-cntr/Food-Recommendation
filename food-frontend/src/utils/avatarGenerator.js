export const generateRandomAvatar = (name = "User") => {
    const initial = name.charAt(0).toUpperCase();
    
    // Neubrutalist Palette
    const colors = ['#ffcf5a', '#ff6b6b', '#a0e7e5', '#b4f8c8', '#fbe7c6', '#9d81e1'];
    
    // DETERMINISTIC SELECTION: 
    // Instead of Math.random(), we use the name to pick the color index.
    // This ensures "John" always gets the same color.
    const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = charCodeSum % colors.length;
    const bgColor = colors[colorIndex];
    
    const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='4 6 100 80'>
        <rect width='100' height='100' fill='black'/>
        <rect width='90' height='90' x='5' y='5' fill='${bgColor}' stroke='black' stroke-width='2'/>
        <text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='50' font-weight='900' fill='black'>${initial}</text>
    </svg>`;

    const base64 = btoa(svg);
    return `data:image/svg+xml;base64,${base64}`;
};