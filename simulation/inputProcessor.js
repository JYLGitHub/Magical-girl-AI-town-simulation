// simulation/inputHandler.js (새 버전)
const { processInputs } = require('./inputProcessor');

async function processActions(actions, world) {
    console.log("\n--- [2.5단계: 핸들러가 받은 계획서] ---");
    console.log(actions);
    
    return await processInputs(actions, world);
}

module.exports = { processActions };