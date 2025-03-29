// 游戏用户界面

class UI {
    constructor(game) {
        this.game = game;
        
        // UI元素
        this.characterStats = document.getElementById("character-stats");
        this.questList = document.getElementById("quest-list");
        this.inventorySlots = document.getElementById("inventory-slots");
        this.equipmentSlots = document.getElementById("equipment-slots");
        this.skillTree = document.getElementById("skill-tree");
        
        // 初始化UI
        this.initUI();
    }
    
    initUI() {
        console.log("初始化UI...");
        
        // 确保所有UI面板初始时都是隐藏的 - 使用直接DOM操作确保状态正确
        document.getElementById('inventory-screen').classList.add('hidden');
        document.getElementById('skill-tree-screen').classList.add('hidden');
        document.getElementById('combat-screen').classList.add('hidden');
        
        // 添加菜单按钮
        this.createMenuButtons();
        
        // 初始化UI元素
        this.updateUI();
        
        // 添加键盘快捷键
        this.setupShortcuts();
        
        console.log("UI初始化完成");
    }
    
    createMenuButtons() {
        // 创建游戏菜单按钮
        const gameContainer = document.getElementById("game-container");
        
        const menuDiv = document.createElement("div");
        menuDiv.id = "game-menu";
        menuDiv.className = "ui-panel";
        menuDiv.style.position = "absolute";
        menuDiv.style.top = "10px";
        menuDiv.style.left = "10px";
        menuDiv.style.zIndex = "100";
        
        // 物品按钮
        const inventoryBtn = document.createElement("button");
        inventoryBtn.textContent = "物品 (I)";
        inventoryBtn.onclick = () => this.toggleInventory();
        
        // 技能按钮
        const skillBtn = document.createElement("button");
        skillBtn.textContent = "技能 (K)";
        skillBtn.onclick = () => this.toggleSkillTree();
        
        // 保存按钮
        const saveBtn = document.createElement("button");
        saveBtn.textContent = "保存游戏";
        saveBtn.onclick = () => this.game.saveGameData();
        
        // 添加按钮到菜单
        menuDiv.appendChild(inventoryBtn);
        menuDiv.appendChild(skillBtn);
        menuDiv.appendChild(saveBtn);
        
        // 添加退出按钮
        const exitBtn = document.createElement("button");
        exitBtn.textContent = "返回主菜单";
        exitBtn.onclick = () => this.showConfirmDialog("确定要返回主菜单吗？未保存的进度将丢失", () => {
            this.game.changeState(GameState.MENU);
        });
        menuDiv.appendChild(exitBtn);
        
        // 添加菜单到游戏容器
        gameContainer.appendChild(menuDiv);
    }
    
    showConfirmDialog(message, onConfirm) {
        // 创建确认对话框
        const dialogOverlay = document.createElement("div");
        dialogOverlay.className = "dialog-overlay";
        
        const dialogBox = document.createElement("div");
        dialogBox.className = "dialog-box";
        
        const messageElement = document.createElement("p");
        messageElement.textContent = message;
        
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "dialog-buttons";
        
        const confirmBtn = document.createElement("button");
        confirmBtn.textContent = "确认";
        confirmBtn.onclick = () => {
            document.body.removeChild(dialogOverlay);
            if (onConfirm) onConfirm();
        };
        
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "取消";
        cancelBtn.onclick = () => {
            document.body.removeChild(dialogOverlay);
        };
        
        buttonContainer.appendChild(confirmBtn);
        buttonContainer.appendChild(cancelBtn);
        
        dialogBox.appendChild(messageElement);
        dialogBox.appendChild(buttonContainer);
        
        dialogOverlay.appendChild(dialogBox);
        document.body.appendChild(dialogOverlay);
    }
    
    // 添加对话框显示方法
    showDialog(name, message, options = []) {
        const dialogOverlay = document.createElement("div");
        dialogOverlay.className = "dialog-overlay";
        
        const dialogBox = document.createElement("div");
        dialogBox.className = "dialog-box npc-dialog";
        
        const nameElement = document.createElement("div");
        nameElement.className = "npc-name";
        nameElement.textContent = name;
        
        const messageElement = document.createElement("p");
        messageElement.className = "npc-message";
        messageElement.textContent = message;
        
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "dialog-buttons";
        
        // 添加选项按钮
        if (options.length > 0) {
            options.forEach(option => {
                const button = document.createElement("button");
                button.textContent = option.text;
                button.onclick = () => {
                    document.body.removeChild(dialogOverlay);
                    if (option.callback) option.callback();
                };
                buttonContainer.appendChild(button);
            });
        } else {
            // 默认关闭按钮
            const closeBtn = document.createElement("button");
            closeBtn.textContent = "关闭";
            closeBtn.onclick = () => {
                document.body.removeChild(dialogOverlay);
            };
            buttonContainer.appendChild(closeBtn);
        }
        
        dialogBox.appendChild(nameElement);
        dialogBox.appendChild(messageElement);
        dialogBox.appendChild(buttonContainer);
        
        dialogOverlay.appendChild(dialogBox);
        document.body.appendChild(dialogOverlay);
    }
    
    // 添加游戏通知功能
    showNotification(message, type = "info", duration = 3000) {
        const notification = document.createElement("div");
        notification.className = `game-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 淡入效果
        setTimeout(() => {
            notification.style.opacity = "1";
        }, 10);
        
        // 自动关闭
        setTimeout(() => {
            notification.style.opacity = "0";
            
            // 淡出后移除元素
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, duration);
    }
    
    setupShortcuts() {
        window.addEventListener("keydown", (e) => {
            // 物品快捷键
            if (e.key === "i" || e.key === "I") {
                this.toggleInventory();
            }
            
            // 技能快捷键
            if (e.key === "k" || e.key === "K") {
                this.toggleSkillTree();
            }
            
            // ESC键关闭所有面板
            if (e.key === "Escape") {
                this.closeAllPanels();
            }
        });
    }
    
    toggleInventory() {
        const inventoryScreen = document.getElementById("inventory-screen");
        if (inventoryScreen.classList.contains("hidden")) {
            this.closeAllPanels();
            this.game.equipmentSystem.showInventoryScreen();
        } else {
            this.game.equipmentSystem.hideInventoryScreen();
        }
    }
    
    toggleSkillTree() {
        console.log("切换技能树显示状态");
        const skillTreeScreen = document.getElementById("skill-tree-screen");
        
        if (!skillTreeScreen) {
            console.error("找不到技能树界面!");
            return;
        }
        
        if (skillTreeScreen.classList.contains("hidden")) {
            // 当前隐藏，需要显示
            this.closeAllPanels(); // 先关闭所有面板
            this.game.skillSystem.showSkillTreeScreen();
        } else {
            // 当前显示，需要隐藏
            this.game.skillSystem.hideSkillTreeScreen();
            // 切换回探索状态
            this.game.changeState(GameState.EXPLORING);
        }
    }
    
    closeAllPanels() {
        // 隐藏所有面板
        const inventoryScreen = document.getElementById("inventory-screen");
        const skillTreeScreen = document.getElementById("skill-tree-screen");
        
        if (inventoryScreen) inventoryScreen.classList.add("hidden");
        if (skillTreeScreen) skillTreeScreen.classList.add("hidden");
    }
    
    updateUI() {
        // 更新所有UI元素
        this.updateCharacterInfo();
        this.updateQuestLog();
        this.updateInventory();
        this.updateSkillTree();
    }
    
    updateCharacterInfo() {
        const character = this.game.character;
        
        this.characterStats.innerHTML = `
            <div>${character.name} Lv.${character.level}</div>
            <div>HP: ${character.currentHp}/${character.maxHp}</div>
            <div>攻击: ${character.getAttack()}</div>
            <div>防御: ${character.getDefense()}</div>
            <div>经验: ${character.experience}/${character.expToNextLevel}</div>
            <div>金币: ${character.gold}</div>
        `;
    }
    
    updateQuestLog() {
        const character = this.game.character;
        this.questList.innerHTML = "";
        
        if (character.activeQuests.length === 0) {
            this.questList.innerHTML = "<div>没有进行中的任务</div>";
            return;
        }
        
        for (const quest of character.activeQuests) {
            const questElement = document.createElement("div");
            questElement.className = "quest-item";
            
            let objectivesHtml = "";
            for (const objKey in quest.objectives) {
                const obj = quest.objectives[objKey];
                objectivesHtml += `<div>${obj.targetType}: ${obj.current}/${obj.required}</div>`;
            }
            
            questElement.innerHTML = `
                <div class="quest-title">${quest.title}</div>
                <div class="quest-desc">${quest.description}</div>
                <div class="quest-objectives">${objectivesHtml}</div>
            `;
            
            this.questList.appendChild(questElement);
        }
    }
    
    updateInventory() {
        // 通过装备系统更新物品栏UI
        if (this.game.equipmentSystem) {
            this.game.equipmentSystem.updateInventoryUI();
        }
    }
    
    updateSkillTree() {
        // 通过技能系统更新技能树UI
        if (this.game.skillSystem && this.game.currentState === GameState.SKILLS) {
            // 只在技能树状态才更新技能树UI
            this.game.skillSystem.updateSkillTreeUI();
        }
    }
}
