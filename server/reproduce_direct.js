const https = require('https');

const apiKey = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';
const processNumber = '0001234-56.2023.8.26.0506'; // TJSP Control
const url = 'https://api-publica.datajud.cnj.jus.br/api_publica_tjsp/_search';

const payload = JSON.stringify({
    "query": {
        "match": {
            "numeroProcesso": processNumber.replace(/\D/g, '')
        }
    }
});

console.log(`Testing direct connection to ${url}`);
console.log(`Payload: ${payload}`);

const options = {
    method: 'POST',
    headers: {
        'Authorization': `APIKey ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
};

const req = https.request(url, options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Body:', data);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(payload);
req.end();
