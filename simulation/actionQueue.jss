// simulation/actionQueue.js
class ActionQueue {
    constructor() {
        this.queue = [];
        this.handlers = new Map();
        this.registerHandlers();
    }

    // 액션 핸들러 등록
    registerHandlers() {
        this.handlers.set('startConversation', require('./handlers/conversationHandler').startConversation);
        this.handlers.set('continueConversation', require('./handlers/conversationHandler').continueConversation);
        this.handlers.set('leaveConversation', require('./handlers/conversationHandler').leaveConversation);
        this.handlers.set('script', require('./handlers/scriptHandler').handleScript);
        this.handlers.set('sendMessage', require('./handlers/messageHandler').sendMessage);
        this.handlers.set('listen', require('./handlers/basicHandler').listen);
    }

    // 액션을 큐에 추가
    enqueue(action, world) {
        const queueItem = {
            id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            action,
            world,
            status: 'pending',
            timestamp: new Date().toISOString()
        };
        this.queue.push(queueItem);
        return queueItem.id;
    }

    // 큐 처리
    async processQueue() {
        const results = [];
        
        while (this.queue.length > 0) {
            const queueItem = this.queue.shift();
            try {
                const result = await this.processAction(queueItem);
                results.push(result);
            } catch (error) {
                console.error(`[액션 처리 오류] ${queueItem.action.actionName}:`, error);
                queueItem.status = 'failed';
                queueItem.error = error.message;
                results.push(queueItem);
            }
        }
        
        return results;
    }

    // 개별 액션 처리
    async processAction(queueItem) {
        const { action, world } = queueItem;
        const handler = this.handlers.get(action.actionName);
        
        if (!handler) {
            throw new Error(`알 수 없는 액션: ${action.actionName}`);
        }

        queueItem.status = 'processing';
        const result = await handler(action, world);
        queueItem.status = 'completed';
        queueItem.result = result;
        
        return queueItem;
    }
}

module.exports = { ActionQueue };