// 装备系统

class Equipment {
    constructor(id, name, type, level, attackBonus, defenseBonus, description) {
        this.id = id;
        this.name = name;
        this.type = type; // weapon, armor, helmet, accessory
        this.level = level;
        this.attackBonus = attackBonus || 0;
        this.defenseBonus = defenseBonus || 0;
        this.description = description || "";
    }
}

class EquipmentSystem {
    constructor(game) {
        this.game = game;
        this.equipmentData = {};
        this.inventory = [];
        
        // 加载装备数据
        this.loadEquipmentData();
    }
    
    loadEquipmentData() {
        // 这里应该从JSON文件加载，为简单起见直接在代码中定义
        this.equipmentData = {
            "wooden_sword": new Equipment(
                "wooden_sword", 
                "木剑", 
                "weapon", 
                1, 
                5, 
                0, 
                "新手冒险者的第一把剑。"
            ),
            "初级剑": new Equipment(
                "初级剑", 
                "初级剑", 
                "weapon", 
                3, 
                10, 
                0, 
                "基础的钢剑，锋利程度一般。"
            ),
            "初级皮甲": new Equipment(
                "初级皮甲", 
                "初级皮甲", 
                "armor", 
                2, 
                0, 
                8, 
                "用动物皮毛制成的轻便护甲。"
            ),
            "中级靴子": new Equipment(
                "中级靴子", 
                "中级靴子", 
                "accessory", 
                4, 
                2, 
                5, 
                "精心缝制的皮靴，提供不错的防护并略微提升攻击力。"
            ),
            "铁头盔": new Equipment(
                "铁头盔", 
                "铁头盔", 
                "helmet", 
                3, 
                0, 
                7, 
                "铁制头盔，能够有效抵挡头部伤害。"
            )
        };
    }
    
    addItem(itemId) {
        const item = this.equipmentData[itemId];
        if (!item) {
            console.error(`物品 ${itemId} 不存在`);
            return false;
        }
        
        this.inventory.push(item);
        console.log(`获得物品: ${item.name}`);
        
        // 更新UI
        this.game.ui.updateInventory();
        return true;
    }
    
    equipItem(itemIndex) {
        if (itemIndex < 0 || itemIndex >= this.inventory.length) {
            console.error("无效的物品索引");
            return false;
        }
        
        const item = this.inventory[itemIndex];
        const character = this.game.character;
        
        // 先卸下当前装备的同类型物品
        if (character.equipment[item.type]) {
            this.inventory.push(character.equipment[item.type]);
        }
        
        // 装备新物品
        character.equipment[item.type] = item;
        
        // 从物品栏移除
        this.inventory.splice(itemIndex, 1);
        
        console.log(`装备了 ${item.name}`);
        
        // 更新UI
        this.game.ui.updateCharacterInfo();
        this.game.ui.updateInventory();
        
        return true;
    }
    
    unequipItem(slot) {
        const character = this.game.character;
        
        if (!character.equipment[slot]) {
            console.error(`${slot} 槽位没有装备物品`);
            return false;
        }
        
        // 将装备添加到物品栏
        this.inventory.push(character.equipment[slot]);
        
        // 清空装备槽
        character.equipment[slot] = null;
        
        console.log(`卸下了 ${slot} 槽位的装备`);
        
        // 更新UI
        this.game.ui.updateCharacterInfo();
        this.game.ui.updateInventory();
        
        return true;
    }
    
    showInventoryScreen() {
        const inventoryScreen = document.getElementById("inventory-screen");
        if (inventoryScreen) {
            inventoryScreen.classList.remove("hidden");
            this.game.changeState(GameState.INVENTORY); // 确保状态正确更新
            this.updateInventoryUI();
        } else {
            console.error("找不到物品栏界面元素!");
        }
    }
    
    hideInventoryScreen() {
        const inventoryScreen = document.getElementById("inventory-screen");
        if (inventoryScreen) {
            inventoryScreen.classList.add("hidden");
            // 不要在这里更改游戏状态，应该由调用者控制
        }
    }
    
    updateInventoryUI() {
        const inventorySlots = document.getElementById("inventory-slots");
        const equipmentSlots = document.getElementById("equipment-slots");
        
        // 清空当前显示
        inventorySlots.innerHTML = "";
        equipmentSlots.innerHTML = "";
        
        // 显示物品栏
        this.inventory.forEach((item, index) => {
            const itemElement = document.createElement("div");
            itemElement.className = "inventory-item";
            itemElement.innerHTML = `
                <div>${item.name} (${item.type})</div>
                <div>攻击 +${item.attackBonus} 防御 +${item.defenseBonus}</div>
                <div class="item-desc">${item.description}</div>
                <button class="equip-btn">装备</button>
            `;
            
            // 添加装备按钮事件
            const equipBtn = itemElement.querySelector(".equip-btn");
            equipBtn.addEventListener("click", () => this.equipItem(index));
            
            inventorySlots.appendChild(itemElement);
        });
        
        if (this.inventory.length === 0) {
            const emptyMessage = document.createElement("div");
            emptyMessage.textContent = "物品栏是空的";
            emptyMessage.className = "empty-message";
            inventorySlots.appendChild(emptyMessage);
        }
        
        // 显示已装备物品
        const character = this.game.character;
        for (const slot in character.equipment) {
            const item = character.equipment[slot];
            const slotElement = document.createElement("div");
            slotElement.className = "equipment-slot";
            
            if (item) {
                slotElement.innerHTML = `
                    <div>${this.getSlotName(slot)}: ${item.name}</div>
                    <div>攻击 +${item.attackBonus} 防御 +${item.defenseBonus}</div>
                    <div class="item-desc">${item.description}</div>
                    <button class="unequip-btn">卸下</button>
                `;
                
                // 添加卸下按钮事件
                const unequipBtn = slotElement.querySelector(".unequip-btn");
                unequipBtn.addEventListener("click", () => this.unequipItem(slot));
            } else {
                slotElement.innerHTML = `<div>${this.getSlotName(slot)}: 未装备</div>`;
            }
            
            equipmentSlots.appendChild(slotElement);
        }
    }
    
    getSlotName(slot) {
        // 将英文槽位名称转换为中文
        const slotNames = {
            "weapon": "武器",
            "armor": "护甲",
            "helmet": "头盔",
            "accessory": "饰品"
        };
        
        return slotNames[slot] || slot;
    }
    
    // 添加装备升级功能
    upgradeItem(itemIndex) {
        if (itemIndex < 0 || itemIndex >= this.inventory.length) {
            console.error("无效的物品索引");
            return false;
        }
        
        const item = this.inventory[itemIndex];
        const character = this.game.character;
        
        // 计算升级费用
        const goldCost = item.level * 200;
        
        if (character.gold < goldCost) {
            console.log(`金币不足，升级需要 ${goldCost} 金币`);
            return false;
        }
        
        // 扣除金币
        character.gold -= goldCost;
        
        // 提升装备等级和属性
        item.level += 1;
        item.attackBonus = Math.floor(item.attackBonus * 1.2);
        item.defenseBonus = Math.floor(item.defenseBonus * 1.2);
        
        console.log(`${item.name} 升级成功！现在是 ${item.level} 级装备`);
        
        // 更新UI
        this.updateInventoryUI();
        this.game.ui.updateCharacterInfo();
        
        return true;
    }
    
    // 添加装备出售功能
    sellItem(itemIndex) {
        if (itemIndex < 0 || itemIndex >= this.inventory.length) {
            console.error("无效的物品索引");
            return false;
        }
        
        const item = this.inventory[itemIndex];
        const character = this.game.character;
        
        // 计算出售价格
        const sellPrice = item.level * 50;
        
        // 添加金币
        character.gold += sellPrice;
        
        // 从物品栏移除
        this.inventory.splice(itemIndex, 1);
        
        console.log(`出售了 ${item.name}，获得 ${sellPrice} 金币`);
        
        // 更新UI
        this.updateInventoryUI();
        this.game.ui.updateCharacterInfo();
        
        return true;
    }
}
