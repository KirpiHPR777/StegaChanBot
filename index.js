const {config} = require('dotenv');
config();
const steganography = require('./steganography');
const {mkdir} = require('fs');

const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_API_TOKEN;
const bot = new TelegramBot(token, {polling: true});

bot.setMyCommands([
    {command: '/start', description: 'Say \'Hello!\'.'},
    {command: '/encode', description:'Encode message.'},
    {command: '/decode', description:'Decode message.'},
    {command: '/please', description: 'Magic word.'}
]);

let operation = '';
let secretMessage = '';
let sendImagePath = '';

bot.on('message', msg =>{  
    if(msg.text === '/start'){
        operation = '';
        return bot.sendMessage(msg.chat.id, `Hi, ${msg.from.first_name}. I am a bot-chan. I can help you save your secrets. ( ˶ ❛ ꁞ ❛ ˶ )`);
    }

    else if(msg.text === '/encode'){
        operation = 'encode_1';
        return bot.sendMessage(msg.chat.id, `Please, give me secret message. The max lenght ~140!!! The correct symbols: english letters, numbers and !?.@,!!!`);
    }

    else if(msg.text === '/decode'){
        operation = 'decode_1';
        return bot.sendMessage(msg.chat.id, `Please, give me image for decode, but only what I encoded.`);
    }

    else if(operation === 'encode_1' && msg.text){
        let invalidSymbols = steganography.foundInvalidSymbols(msg.text);
        let lengthOfSecretMessage = steganography.returnSecretBits(msg.text).length;

        if(invalidSymbols.length !== 0)
            return bot.sendMessage(msg.chat.id, `I found invalid symbols: ${invalidSymbols.join(' ')}. Try again. ╮(. ❛ ᴗ ❛.)╭`);
        else if(lengthOfSecretMessage > 1000)
            return bot.sendMessage(msg.chat.id, `The max length of message is ~140. Try again. ╮(. ❛ ᴗ ❛.)╭`);
        else{
            secretMessage = msg.text;
            operation = 'encode_2';
            return bot.sendMessage(msg.chat.id, `Nice! So now give me an image for encode, but only PNG!!! P.S. Telegram doesn\'t like PNG, it converts it in JPEG. So you can\'t give me the image as a photo. Send me it as a file!!!`);
        }
    }

    else if(operation === 'encode_1' && !msg.text)
        return bot.sendMessage(msg.chat.id, `It is not text. Try again. ╮(. ❛ ᴗ ❛.)╭`);
    
    else if(msg.text === '/please' && operation === 'encode_3'){
        operation = '';
        return bot.sendDocument(msg.chat.id, sendImagePath);
    }
    
    else if((operation === 'decode_1' || operation === 'encode_2') && msg.document){
        bot.on('document', message => {
            if(message.document.mime_type !== 'image/png' && !message.text)
                return bot.sendMessage(msg.chat.id, `It is not PNG. Try again. ╮(. ❛ ᴗ ❛.)╭`);
            
            let chatID = message.chat.id;
            let downloadingDateTime = new Date().toLocaleString().replace(/\.|\:|, /g, '_');
            let downloadPath = `./img/${chatID}/${downloadingDateTime}/`;
            mkdir(downloadPath, { recursive: true }, error => {if(error) console.log(`Something was wrong in creating new dir.`);});

            let fileID = message.document.file_id;
            bot.downloadFile(fileID, downloadPath)
            .then(path => {
                if(operation === 'encode_2'){
                    steganography.encode(path, downloadPath, secretMessage).then(() => {
                        operation = 'encode_3';
                        sendImagePath = `${downloadPath}encode.png`;
                        return bot.sendMessage(message.chat.id, 'Where is magic word, honey? (人*❛∀❛)｡*ﾟ+');
                    });
                } else if(operation === 'decode_1'){
                    steganography.decode(path)
                    .then(secretMessage => {
                        operation = '';
                        return bot.sendMessage(message.chat.id, secretMessage  || 'Message is empty');
                    });
                }
            });
        });
    }

    else if((operation === 'decode_1' || operation === 'encode_2') && !msg.document)
        return bot.sendMessage(msg.chat.id, `It is not PNG. I honestly don't know what is it. Try again. ╮(. ❛ ᴗ ❛.)╭`);

    else{
        operation = '';
        return bot.sendMessage(msg.chat.id, 'Mommy! I don\'t know what this man wants! He is scaring me!');
    } 
});
