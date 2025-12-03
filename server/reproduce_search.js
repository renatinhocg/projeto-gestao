const jwt = require('jsonwebtoken');
const JWT_SECRET = 'change_this_secret'; // Default from index.ts
const token = jwt.sign({ sub: 1, email: 'test@example.com' }, JWT_SECRET);

const processes = [
    '0100687-15.2025.5.01.0047',
    '0101296-37.2025.5.01.0034',
    '0101407-73.2025.5.01.0243',
    '0100713-44.2025.5.01.0263',
    '0100924-60.2025.5.01.0011',
    '0100450-48.2021.5.01.0264',
    '0100879-49.2025.5.01.0078',
    '0101120-16.2025.5.01.0242',
    '0101418-62.2025.5.01.0030',
    '0101082-28.2025.5.01.0040',
    '0100469-12.2025.5.01.0071'
];

async function test() {
    const processNumber = '0100469-12.2025.5.01.0071'; // User reported this one works
    console.log(`Testing ${processNumber}...`);
    try {
        const res = await fetch('http://localhost:4000/api/lawsuits/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ processNumber })
        });
        const json = await res.json();
        console.log(JSON.stringify(json, null, 2));
    } catch (err) {
        console.log(`[ERROR] ${processNumber}: ${err.message}`);
    }
}

test();
