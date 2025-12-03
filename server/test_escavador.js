const https = require('https');

const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYTcwZTQ0NGU2ZGEyMDc4YzZjZGVjNGM0ZjMyOWIyNDQ2ZTVmNWNhZmEzZTMzODc4ZmRkNTM0MWI3YTQ2YTdlZWVmMTgzN2VjNGNhODhhMWIiLCJpYXQiOjE3NjQ2ODExNDguMzE3MDM2LCJuYmYiOjE3NjQ2ODExNDguMzE3MDM3LCJleHAiOjIwODAyMTM5NDguMzEyODA3LCJzdWIiOiIyOTg4MDA3Iiwic2NvcGVzIjpbImFjZXNzYXJfYXBpX3BhZ2EiLCJhY2Vzc2FyX2FwaV9wbGF5Z3JvdW5kIl19.T-3NAH963DQ3q4BzjQTkEEKjjjS9IFlQbc1rtq5RX9M1gqvtFPBXX0tPfDGwkh9Jha_WQNgOHgfcNPrH1tmYTifHVZQeE15qtpVtH9d_Rm7h8I_O245CHvxCday0IOtjy-cXISVWOt797K2v8faW_LLQXw1ZBp2Y3ArDhzT36AXAtaoAyfXPWPObIRs0R_GWTZdM6KuFY-QQjAq1pYq0k8W0per9uqKMxpHPNJ1BuDueSerFzPQIJnaRX3BD7lgRWoD4aOmEzt2coxuA3lEPrhfVOlhdCY0HVfXm5CIwnLv1ZB20GWNrIrd14QKWHAVivcNpSF08Mhv0KYLA9LgxTTXp_kkdxl4xgcWIMk2H-AAU9P7kLgztUQFSe0pOUaeuJpScj8p0j2upyhJD_Rq3mnyeZXojPdjmSEuaQ836yyVE1LmyerJDAbNfOH84F1fwK0a91DIY6Xl7UZQDAjY7OOiSSX8eMjR29LRamBms1jn0w3DXDiTlB2QIHOuTSt_vlqq6XONgBeR9QjW8euo6EN5K9p8dai3tBAzm8QiYAV69SMSQARUKYYGv023MMOCJii01VTh5ljvc7N2JZw7zGe0eFL_8tgIzTH4ouLQS_jgLi8Q6YveOLYtgIoRFwvI1xzhc7baNDWFPRCqzv3NyBzIZBb57UXO-u7URd-11pWo';

// Processo do Rio que falhou no DataJud
const processNumber = '0101296-37.2025.5.01.0034';
const url = `https://api.escavador.com/api/v2/processos/numero_cnj/${processNumber}`;

console.log(`Testing Escavador API: ${url}`);

const options = {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest' // Sometimes needed
    }
};

const req = https.request(url, options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Body:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('Body (text):', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
