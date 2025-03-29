// 任务系统

class QuestSystem {
    constructor(game) {
        this.game = game;
        this.questData = {};
        this.loadQuestData();
    }
    
    loadQuestData() {
        // 这里应该从JSON文件加载，为简单起见直接在代码中定义
        this.questData = {
            "quest1": {
                id: "quest1",
                title: "消灭小妖精",
                description: "消灭5只小妖精以保护村庄安全。",
                objectives: {
                    kill: {
                        targetType: "小妖精",
                        required: 5,
                        current: 0
                    }
                },
                rewards: {
                    experience: 200,
                    gold: 100,
                    items: ["初级皮甲"]
                },
                nextQuest: "quest2"
            },
            "quest2": {
                id: "quest2",
                title: "探索古老遗迹",
                description: "前往东部森林寻找古老遗迹的入口。",
                objectives: {
                    discover: {
                        targetType: "遗迹入口",
                        required: 1,
                        current: 0
                    }
                },
                rewards: {
                    experience: 500,
                    gold: 300,
                    items: ["中级靴子"]
                }
            }
        };
    }
    
    startQuest(questId) {
        const quest = this.questData[questId];
        
        if (!quest) {
            console.error(`任务 ${questId} 不存在！`);
            return false;
        }
        
        // 检查该任务是否已经激活或已完成
        const character = this.game.character;
        if (character.activeQuests.some(q => q.id === questId) || 
            character.completedQuests.includes(questId)) {
            console.log("这个任务已经接受或完成了。");
            return false;
        }
        
        // 添加到活跃任务
        const activeQuest = JSON.parse(JSON.stringify(quest)); // 深拷贝
        // 重置当前进度
        for (const obj in activeQuest.objectives) {
            activeQuest.objectives[obj].current = 0;
        }
        
        character.activeQuests.push(activeQuest);
        console.log(`接受了新任务: ${quest.title}`);
        
        // 更新UI
        this.game.ui.updateQuestLog();
        
        return true;
    }
    
    updateObjective(objectiveType, targetType, amount = 1) {
        const character = this.game.character;
        let questUpdated = false;
        
        // 遍历所有活跃任务
        for (const quest of character.activeQuests) {
            for (const objKey in quest.objectives) {
                const objective = quest.objectives[objKey];
                
                // 检查这个目标是否匹配
                if (objKey === objectiveType && objective.targetType === targetType) {
                    objective.current = Math.min(objective.required, objective.current + amount);
                    console.log(`任务 "${quest.title}" 进度更新: ${objective.current}/${objective.required}`);
                    questUpdated = true;
                    
                    // 检查任务是否完成
                    if (this.checkQuestCompletion(quest)) {
                        this.completeQuest(quest.id);
                    }
                }
            }
        }
        
        // 如果有任务更新，更新UI
        if (questUpdated) {
            this.game.ui.updateQuestLog();
        }
    }
    
    checkQuestCompletion(quest) {
        // 检查所有目标是否都已达成
        for (const objKey in quest.objectives) {
            const objective = quest.objectives[objKey];
            if (objective.current < objective.required) {
                return false;
            }
        }
        return true;
    }
    
    completeQuest(questId) {
        const character = this.game.character;
        const questIndex = character.activeQuests.findIndex(q => q.id === questId);
        
        if (questIndex === -1) {
            console.error(`找不到要完成的任务 ${questId}`);
            return;
        }
        
        const quest = character.activeQuests[questIndex];
        
        // 给予奖励
        character.gainExperience(quest.rewards.experience);
        character.gold += quest.rewards.gold;
        
        // 添加物品
        if (quest.rewards.items) {
            for (const itemName of quest.rewards.items) {
                this.game.equipmentSystem.addItem(itemName);
            }
        }
        
        // 从活跃任务中移除并添加到已完成任务
        character.activeQuests.splice(questIndex, 1);
        character.completedQuests.push(questId);
        
        console.log(`任务完成: ${quest.title}`);
        console.log(`获得奖励: ${quest.rewards.experience} 经验, ${quest.rewards.gold} 金币`);
        
        // 如果有后续任务，自动开始
        if (quest.nextQuest) {
            this.startQuest(quest.nextQuest);
        }
        
        // 更新UI
        this.game.ui.updateQuestLog();
        this.game.ui.updateCharacterInfo();
    }
}
