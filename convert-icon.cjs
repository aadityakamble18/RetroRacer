const fs = require('fs');
const path = require('path');

async function convert() {
    try {
        const pngToIco = require('png-to-ico');
        const buf = await pngToIco(path.join(__dirname, 'build/icon.png'));
        fs.writeFileSync(path.join(__dirname, 'build/icon.ico'), buf);
        console.log('Icon converted successfully!');
    } catch (e) {
        console.error('Conversion failed:', e.message);
    }
}

convert();
