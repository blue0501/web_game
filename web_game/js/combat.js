// 战斗系统

class Monster {
    constructor(type, level) {
        this.type = type;
        this.level = level;
        
        // 根据怪物类型和等级设置属性
        switch (type) {
            case "小妖精":
                this.maxHp = 30 + level * 10;
                this.attack = 5 + level * 2;
                this.defense = 2 + level;
                this.expReward = 20 + level * 5;
                this.goldReward = 10 + level * 3;
                break;
            case "森林狼":
                this.maxHp = 50 + level * 15;
                this.attack = 8 + level * 3;
                this.defense = 3 + level * 1.5;
                this.expReward = 35 + level * 8;
                this.goldReward = 20 + level * 5;
                break;
            case "山贼":
                this.maxHp = 80 + level * 20;
                this.attack = 12 + level * 4;
                this.defense = 5 + level * 2;
                this.expReward = 50 + level * 12;
                this.goldReward = 40 + level * 10;
                break;
            default:
                this.maxHp = 40 + level * 12;
                this.attack = 7 + level * 2.5;
                this.defense = 3 + level * 1.2;
                this.expReward = 30 + level * 7;
                this.goldReward = 15 + level * 4;
        }
        
        this.currentHp = this.maxHp;
        this.sprite = null; // 怪物图片
    }
    
    takeDamage(amount) {
        const actualDamage = Math.max(1, amount - this.defense / 2);
        this.currentHp -= actualDamage;
        
        if (this.currentHp < 0) {
            this.currentHp = 0;
        }
        
        return actualDamage;
    }
    
    isDead() {
        return this.currentHp <= 0;
    }
}

class CombatSystem {
    constructor(game) {
        this.game = game;
        this.inCombat = false;
        this.currentMonster = null;
        this.combatLog = [];
        this.turn = "player"; // "player" or "monster"
        this.combatScreen = document.getElementById("combat-screen");
        this.combatActions = document.getElementById("combat-actions");
        this.combatLogElement = document.getElementById("combat-log");
        this.playerCombatElement = document.getElementById("player-combat");
        this.enemyCombatElement = document.getElementById("enemy-combat");
    }
    
    startCombat(monsterType) {
        // 生成一个怪物
        const monsterLevel = Math.max(1, this.game.character.level - 1 + Math.floor(Math.random() * 3));
        this.currentMonster = new Monster(monsterType, monsterLevel);
        
        // 设置战斗状态
        this.inCombat = true;
        this.turn = "player";
        this.combatLog = [];
        this.addToCombatLog(`遭遇了 ${monsterLevel}级 ${monsterType}！`);
        
        // 显示战斗界面
        this.combatScreen.classList.remove("hidden");
        
        // 创建战斗动作按钮
        this.createCombatActions();
        
        // 更新游戏状态
        this.game.changeState(GameState.COMBAT);
        
        // 更新UI
        this.updateCombatUI();
    }
    
    endCombat(playerWon) {
        this.inCombat = false;
        
        if (playerWon) {
            const monster = this.currentMonster;
            const character = this.game.character;
            
            // 获得经验和金币
            character.gainExperience(monster.expReward);
            character.gold += monster.goldReward;
            
            this.addToCombatLog(`战斗胜利！获得 ${monster.expReward} 经验和 ${monster.goldReward} 金币`);
            
            // 更新任务进度
            this.game.questSystem.updateObjective("kill", monster.type);
            
            // 延迟一会后关闭战斗界面
            setTimeout(() => {
                this.combatScreen.classList.add("hidden");
                this.game.changeState(GameState.EXPLORING);
            }, 2000);
        } else {
            // 角色战败
            this.addToCombatLog("你被打败了...");
            
            // 惩罚：失去一些金币
            const character = this.game.character;
            const goldLost = Math.floor(character.gold * 0.1);
            character.gold -= goldLost;
            
            // 回复一些HP
            character.currentHp = Math.floor(character.maxHp * 0.5);
            
            this.addToCombatLog(`你损失了 ${goldLost} 金币，并被送回村庄医治`);
            
            // 延迟一会后关闭战斗界面
            setTimeout(() => {
                this.combatScreen.classList.add("hidden");
                this.game.changeState(GameState.EXPLORING);
                
                // 将角色送回起始位置
                character.x = 400;
                character.y = 300;
            }, 3000);
        }
        
        // 清空怪物引用
        this.currentMonster = null;
    }
    
    playerAttack() {
        if (this.turn !== "player" || !this.inCombat) return;
        
        const character = this.game.character;
        const monster = this.currentMonster;
        
        // 角色攻击怪物
        const damage = monster.takeDamage(character.getAttack());
        this.addToCombatLog(`你对 ${monster.type} 造成了 ${damage} 点伤害`);
        
        // 更新UI
        this.updateCombatUI();
        
        // 检查怪物是否死亡
        if (monster.isDead()) {
            this.endCombat(true);
            return;
        }
        
        // 切换回合
        this.turn = "monster";
        this.addToCombatLog(`${monster.type} 的回合`);
        
        // 怪物延迟攻击
        setTimeout(() => {
            this.monsterAttack();
        }, 1000);
    }
    
    playerUseSkill(skillId) {
        if (this.turn !== "player" || !this.inCombat) return;
        
        const character = this.game.character;
        const monster = this.currentMonster;
        const skill = character.skills.find(s => s.id === skillId);
        
        if (!skill) {
            console.error(`找不到技能: ${skillId}`);
            return;
        }
        
        // 使用技能
        let damage = 0;
        
        switch (skill.type) {
            case "damage":
                // 伤害技能
                damage = monster.takeDamage(character.getAttack() * skill.effects.damageModifier);
                this.addToCombatLog(`你使用 ${skill.name} 对 ${monster.type} 造成了 ${damage} 点伤害`);
                break;
            case "heal":
                // 治疗技能
                const healAmount = Math.floor(character.maxHp * skill.effects.healPercent);
                character.heal(healAmount);
                this.addToCombatLog(`你使用 ${skill.name} 恢复了 ${healAmount} 点生命`);
                break;
        }
        
        // 更新UI
        this.updateCombatUI();
        
        // 检查怪物是否死亡
        if (monster.isDead()) {
            this.endCombat(true);
            return;
        }
        
        // 切换回合
        this.turn = "monster";
        this.addToCombatLog(`${monster.type} 的回合`);
        
        // 怪物延迟攻击
        setTimeout(() => {
            this.monsterAttack();
        }, 1000);
    }
    
    monsterAttack() {
        if (this.turn !== "monster" || !this.inCombat) return;
        
        const character = this.game.character;
        const monster = this.currentMonster;
        
        // 怪物攻击角色
        const damage = character.takeDamage(monster.attack);
        this.addToCombatLog(`${monster.type} 对你造成了 ${damage} 点伤害`);
        
        // 更新UI
        this.updateCombatUI();
        
        // 检查角色是否死亡
        if (character.currentHp <= 0) {
            this.endCombat(false);
            return;
        }
        
        // 切换回合
        this.turn = "player";
        this.addToCombatLog("你的回合");
    }
    
    createCombatActions() {
        // 清空之前的按钮
        this.combatActions.innerHTML = "";
        
        // 添加基本攻击按钮
        const attackBtn = document.createElement("button");
        attackBtn.textContent = "攻击";
        attackBtn.onclick = () => this.playerAttack();
        this.combatActions.appendChild(attackBtn);
        
        // 添加技能按钮
        const character = this.game.character;
        for (const skill of character.skills) {
            const skillBtn = document.createElement("button");
            skillBtn.textContent = skill.name;
            skillBtn.onclick = () => this.playerUseSkill(skill.id);
            this.combatActions.appendChild(skillBtn);
        }
        
        // 添加物品按钮（如果有）
        // TODO: 实现战斗中使用物品功能
    }
    
    addToCombatLog(message) {
        this.combatLog.push(message);
        
        // 限制日志长度
        if (this.combatLog.length > 10) {
            this.combatLog.shift();
        }
        
        // 更新界面
        this.updateCombatLog();
    }
    
    updateCombatLog() {
        this.combatLogElement.innerHTML = "";
        
        for (const message of this.combatLog) {
            const logEntry = document.createElement("div");
            logEntry.textContent = message;
            this.combatLogElement.appendChild(logEntry);
        }
        
        // 滚动到底部
        this.combatLogElement.scrollTop = this.combatLogElement.scrollHeight;
    }
    
    updateCombatUI() {
        const character = this.game.character;
        const monster = this.currentMonster;
        
        // 更新玩家信息
        this.playerCombatElement.innerHTML = `
            <div>${character.name} Lv.${character.level}</div>
            <div>HP: ${character.currentHp}/${character.maxHp}</div>
            <div>攻击: ${character.getAttack()}</div>
            <div>防御: ${character.getDefense()}</div>
        `;
        
        // 更新怪物信息
        if (monster) {
            this.enemyCombatElement.innerHTML = `
                <div>${monster.type} Lv.${monster.level}</div>
                <div>HP: ${monster.currentHp}/${monster.maxHp}</div>
                <div>攻击: ${monster.attack}</div>
                <div>防御: ${monster.defense}</div>
            `;
        } else {
            this.enemyCombatElement.innerHTML = "";
        }
    }
    
    update(deltaTime) {
        // 战斗系统的更新逻辑
        if (!this.inCombat) return;
    }
    
    render(ctx) {
        // 战斗场景的渲染
        if (!this.inCombat) return;
        
        // 绘制战斗背景
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // 绘制玩家角色
        ctx.fillStyle = "#2196f3";
        ctx.fillRect(200, 400, 64, 64);
        
        // 绘制怪物
        ctx.fillStyle = "#f44336";
        ctx.fillRect(500, 300, 64, 64);
    }
}
