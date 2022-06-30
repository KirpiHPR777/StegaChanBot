const Jimp = require('jimp');

function foundInvalidSymbols(message){
    return message.match(/[^a-zA-Z0-9!?.@, ]+/g) || [];
}

function returnSecretBits(message){
    let bits = '';
    for(let i = 0; i < message.length; i++){
        if((message[i].match(/[0-9!?., ]/g) || []).length === 1)
            bits += '0' + message[i].charCodeAt(0).toString(2);
        else
            bits += message[i].charCodeAt(0).toString(2);
    }
    return bits;
}

function decode(originalPath){
    return Jimp.read(originalPath).then(image => {
        let secretBits = '';
        let lengthOfSecretMessage = 0;
        
        image.scan(0, 0, 1, 1, function (x, y, idx) {
            for(let i = 0; i < 4; i++)
                lengthOfSecretMessage += this.bitmap.data[idx + i];
        });
        
        image.scan(1, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            secretBits += +parseInt(this.bitmap.data[idx]).toString(2).slice(-1);
        });
    
        let secretArray = secretBits.slice(0, lengthOfSecretMessage).match(/.{1,7}/g);
        let secretMessage = '';
    
        for(let i = 0; i < secretArray.length; i++){
            if(secretArray[i][0] === '0')
                secretMessage += String.fromCharCode(parseInt(secretArray[i].slice(1), 2));
            else
                secretMessage += String.fromCharCode(parseInt(secretArray[i], 2));
        }

        return secretMessage;
    }).catch((_) => console.log('Something was wrong in decode.'));
}

function encode(originalPath, downloadPath, message){  
    let bits = returnSecretBits(message);
    let resultImage = `${downloadPath}encode.png`;  
    console.log(`Secret message length: ${bits.length}.`);
    console.log(`Secret bits: ${bits}.`);
    
    return Jimp.read(originalPath).then(async image => {
        image.scan(0, 0, 1, 1, function(x, y, idx) {
            let lengthMessage = bits.length;
            for(let i = 0; i < 4; i++){
                this.bitmap.data[idx + i] = lengthMessage >= 255? 255 : lengthMessage;
                lengthMessage -= lengthMessage >= 255? 255 : lengthMessage;
            }
        });
        
        let indexBit = 0;
        image.scan(1, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            if(bits[indexBit] == 0) this.bitmap.data[idx] &= 254;
            else this.bitmap.data[idx] |= 1;
            indexBit++;
        });
        
        Jimp.read(image.bitmap).then(image => {image.write(resultImage)});

    }).catch((_) => console.log('Something was wrong in encode.'));
}

exports.decode = decode;
exports.encode = encode;
exports.foundInvalidSymbols = foundInvalidSymbols;
exports.returnSecretBits = returnSecretBits;