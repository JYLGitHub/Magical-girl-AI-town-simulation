// core/messageSystem.js

class MessageSystem {
    constructor() {
        this.messageQueue = [];
        this.deliveryDelay = { min: 1, max: 3 }; // 분 단위
    }
    
    sendMessage(fromId, toId, content, world) {
        const message = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            from: fromId,
            to: toId,
            content: content,
            sentTime: this.getCurrentTime(world.situation),
            deliveryTime: this.calculateDeliveryTime(world.situation),
            isRead: false,
            status: 'sent' // sent, delivered, read
        };
        
        this.messageQueue.push(message);
        console.log(`[메시지 발송] ${world.characterDatabase[fromId]?.name} → ${world.characterDatabase[toId]?.name}: "${content}"`);
        return message;
    }
    
    getCurrentTime(situation) {
        return `${situation.day}일차 ${situation.currentHour}:${situation.currentMinute.toString().padStart(2, '0')}`;
    }
    
    calculateDeliveryTime(situation) {
        const delay = Math.floor(Math.random() * (this.deliveryDelay.max - this.deliveryDelay.min + 1)) + this.deliveryDelay.min;
        let deliveryMinute = situation.currentMinute + delay;
        let deliveryHour = situation.currentHour;
        let deliveryDay = situation.day;
        
        if (deliveryMinute >= 60) {
            deliveryHour += Math.floor(deliveryMinute / 60);
            deliveryMinute = deliveryMinute % 60;
        }
        
        if (deliveryHour >= 24) {
            deliveryDay += Math.floor(deliveryHour / 24);
            deliveryHour = deliveryHour % 24;
        }
        
        return `${deliveryDay}일차 ${deliveryHour}:${deliveryMinute.toString().padStart(2, '0')}`;
    }
    
    processDeliveries(world) {
        const currentTime = this.getCurrentTime(world.situation);
        const deliveredMessages = [];
        
        this.messageQueue.forEach(message => {
            if (message.status === 'sent' && this.isTimeReached(message.deliveryTime, currentTime)) {
                message.status = 'delivered';
                
                // 받는 사람의 inbox에 추가
                const recipient = world.characterDatabase[message.to];
                if (recipient) {
                    if (!recipient.messageInbox) recipient.messageInbox = [];
                    recipient.messageInbox.push(message);
                    recipient.unreadMessageCount = (recipient.unreadMessageCount || 0) + 1;

                    // 메시지 도착 알림 설정
                    recipient.hasNewMessage = true;
                    recipient.newMessageAlert = `${world.characterDatabase[message.from]?.name}에게서 메시지가 왔습니다`;
                }
                
                deliveredMessages.push(message);
                console.log(`[메시지 도착] ${world.characterDatabase[message.to]?.name}에게 메시지 도착`);
            }
        });
        
        return deliveredMessages;
    }
    
    isTimeReached(targetTime, currentTime) {
        // 간단한 시간 비교 (실제로는 더 정확한 비교 필요)
        return targetTime <= currentTime;
    }
}

module.exports = { MessageSystem };