const fs = require('fs');
const path = require('path');

const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

const getLogFileName = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return path.join(logDirectory, `${year}-${month}-${day}_terminal.txt`);
};

const logStream = fs.createWriteStream(getLogFileName(), { encoding: 'utf8', flags: 'a' });

// --- ⭐ 핵심 수정 부분 ---

// 기존 console.log와 console.error를 백업합니다.
const originalLog = console.log;
const originalError = console.error;

// console.log를 우리가 만든 새 함수로 교체합니다.
console.log = function(...args) {
    // 1. 메시지를 하나의 문자열로 변환합니다.
    const message = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
            return JSON.stringify(arg, null, 2); // 객체는 보기 좋게 변환
        }
        return arg;
    }).join(' ');

    const timestamp = new Date().toISOString();
    
    // 2. 터미널에는 원래대로 그대로 출력합니다.
    originalLog.apply(console, args);
    // 3. 파일에는 타임스탬프와 함께 기록합니다.
    logStream.write(`[${timestamp}] ${message}\n`);
};

// console.error도 똑같이 처리합니다.
console.error = function(...args) {
    const message = args.map(arg => {
        if (arg instanceof Error) {
            return arg.stack; // 에러 객체는 전체 내용을 기록
        }
        if (typeof arg === 'object' && arg !== null) {
            return JSON.stringify(arg, null, 2);
        }
        return arg;
    }).join(' ');

    const timestamp = new Date().toISOString();
    
    originalError.apply(console, args);
    logStream.write(`[ERROR] [${timestamp}] ${message}\n`);
};