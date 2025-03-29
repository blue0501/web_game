// 技能系统

class Skill {
    constructor(id, name, type, level, cost, description, effects) {
        this.id = id;
        this.name = name;
        this.type = type; // damage, heal, buff, debuff
        this.level = level;
        this.cost = cost; // 经验/魔法点消耗
        this.description = description;
        this.effects = effects; // 包含技能效果的对象，如 damageModifier, healPercent 等
    }
}

class SkillSystem {
    constructor(game) {
        this.game = game;
        this.skillData = {};
        this.skillTree = {};
        
        // 加载技能数据
        this.loadSkillData();
    }
    
    loadSkillData() {
        // 技能数据
        this.skillData = {
            "basic_slash": new Skill(
                "basic_slash",
                "基础斩击",
                "damage",
                1,
                0,
                "对敌人造成120%的物理伤害",
                { damageModifier: 1.2 }
            ),
            "power_strike": new Skill(
                "power_strike",
                "强力打击",
                "damage",
                1,
                5,
                "消耗5点能量，对敌人造成150%的物理伤害",
                { damageModifier: 1.5 }
            ),
            "heal_wound": new Skill(
                "heal_wound",
                "治疗伤口",
                "heal",
                1,
                8,
                "消耗8点能量，恢复20%的最大生命值",
                { healPercent: 0.2 }
            ),
            "double_strike": new Skill(
                "double_strike",
                "双重打击",
                "damage",
                2,
                12,
                "消耗12点能量，对敌人进行两次攻击，每次造成90%的物理伤害",
                { damageModifier: 0.9, hitCount: 2 }
            ),
            "battle_cry": new Skill(
                "battle_cry",
                "战吼",
                "buff",
                2,
                15,
                "消耗15点能量，提高20%攻击力，持续3回合",
                { attackBoost: 0.2, duration: 3 }
            )
        };
        
        // 技能树结构
        this.skillTree = {
            "warrior": {
                "basic_slash": {
                    skill: this.skillData["basic_slash"],
                    requirements: [], // 无需前置技能
                    position: { x: 0, y: 0 }
                },
                "power_strike": {
                    skill: this.skillData["power_strike"],
                    requirements: ["basic_slash"], // 需要先学习基础斩击
                    position: { x: 1, y: 0 }
                },
                "double_strike": {
                    skill: this.skillData["double_strike"],
                    requirements: ["power_strike"],
                    position: { x: 2, y: 0 }
                }
            },
            "support": {
                "heal_wound": {
                    skill: this.skillData["heal_wound"],
                    requirements: [],
                    position: { x: 0, y: 1 }
                },
                "battle_cry": {
                    skill: this.skillData["battle_cry"],
                    requirements: ["heal_wound"],
                    position: { x: 1, y: 1 }
                }
            }
        };
    }
    
    canLearnSkill(skillId) {
        // 查找技能在技能树中的位置
        let treeNode = null;
        let treePath = null;
        
        for (const path in this.skillTree) {
            if (this.skillTree[path][skillId]) {
                treeNode = this.skillTree[path][skillId];
                treePath = path;
                break;
            }
        }
        
        if (!treeNode) {
            console.error(`找不到技能 ${skillId}`);
            return false;
        }
        
        const character = this.game.character;
        
        // 检查人物等级
        if (character.level < treeNode.skill.level * 3) {
            console.log(`需要达到 ${treeNode.skill.level * 3} 级才能学习此技能`);
            return false;
        }
        
        // 检查前置技能是否已学
        for (const reqSkillId of treeNode.requirements) {
            if (!character.skills.some(s => s.id === reqSkillId)) {
                console.log(`需要先学习 ${this.getSkillById(reqSkillId).name}`);
                return false;
            }
        }
        
        // 检查是否已学习该技能
        if (character.skills.some(s => s.id === skillId)) {
            console.log("已经学会了这个技能");
            return false;
        }
        
        return true;
    }
    
    learnSkill(skillId) {
        if (!this.canLearnSkill(skillId)) {
            return false;
        }
        
        const skill = this.getSkillById(skillId);
        const character = this.game.character;
        
        // 检查经验是否足够
        const expCost = skill.level * 100;
        if (character.experience < expCost) {
            console.log(`经验不足，需要 ${expCost} 点经验`);
            return false;
        }
        
        // 扣除经验
        character.experience -= expCost;
        
        // 学习技能
        character.skills.push(skill);
        
        console.log(`学会了技能: ${skill.name}`);
        
        // 更新UI
        this.game.ui.updateSkillTree();
        this.game.ui.updateCharacterInfo();
        
        return true;
    }
    
    getSkillById(skillId) {
        return this.skillData[skillId];
    }
    
    showSkillTreeScreen() {
        console.log("尝试显示技能树");
        
        const skillTreeScreen = document.getElementById("skill-tree-screen");
        if (skillTreeScreen) {
            // 先确保当前游戏状态适合显示技能树
            if (this.game.currentState !== GameState.COMBAT && 
                this.game.currentState !== GameState.MENU) {
                
                // 强制设置显示前先隐藏所有面板
                const inventoryScreen = document.getElementById("inventory-screen");
                if (inventoryScreen) inventoryScreen.classList.add("hidden");
                
                skillTreeScreen.classList.remove("hidden");
                this.game.changeState(GameState.SKILLS);
                this.updateSkillTreeUI();
                console.log("技能树显示成功");
            } else {
                console.log("当前游戏状态不允许显示技能树");
            }
        } else {
            console.error("找不到技能树界面元素!");
        }
    }
    
    hideSkillTreeScreen() {
        console.log("尝试隐藏技能树");
        
        const skillTreeScreen = document.getElementById("skill-tree-screen");
        if (skillTreeScreen) {
            skillTreeScreen.classList.add("hidden");
            console.log("技能树已隐藏");
        }
    }
    
    updateSkillTreeUI() {
        const skillTreeElement = document.getElementById("skill-tree");
        if (!skillTreeElement) {
            console.error("找不到技能树元素");
            return;
        }
        
        // 重要：检查技能树是否正在显示，如果隐藏状态则不更新UI
        const skillTreeScreen = document.getElementById("skill-tree-screen");
        if (skillTreeScreen && skillTreeScreen.classList.contains("hidden")) {
            console.log("技能树处于隐藏状态，不更新UI");
            return;
        }
        
        skillTreeElement.innerHTML = "";
        
        // 为每个路径创建一个容器
        for (const path in this.skillTree) {
            const pathElement = document.createElement("div");
            pathElement.className = "skill-path";
            pathElement.innerHTML = `<h4>${path}</h4>`;
            
            const skillsContainer = document.createElement("div");
            skillsContainer.className = "skills-container";
            
            // 添加该路径下的所有技能
            for (const skillId in this.skillTree[path]) {
                const treeNode = this.skillTree[path][skillId];
                const skill = treeNode.skill;
                
                const skillElement = document.createElement("div");
                skillElement.className = "skill-node";
                skillElement.style.left = `${treeNode.position.x * 120}px`;
                skillElement.style.top = `${treeNode.position.y * 100}px`;
                
                // 检查是否已学习
                const isLearned = this.game.character.skills.some(s => s.id === skillId);
                
                // 检查是否可学习
                const canLearn = this.canLearnSkill(skillId);
                
                skillElement.classList.add(isLearned ? "learned" : (canLearn ? "available" : "locked"));
                
                skillElement.innerHTML = `
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-level">等级 ${skill.level}</div>
                    <div class="skill-desc">${skill.description}</div>
                    ${!isLearned ? `<button class="learn-btn" ${!canLearn ? 'disabled' : ''}>学习</button>` : ''}
                `;
                
                // 添加学习按钮事件
                if (!isLearned) {
                    const learnBtn = skillElement.querySelector(".learn-btn");
                    learnBtn.addEventListener("click", () => this.learnSkill(skillId));
                }
                
                skillsContainer.appendChild(skillElement);
                
                // 绘制连接线（简单实现）
                for (const reqSkillId of treeNode.requirements) {
                    const reqNode = this.skillTree[path][reqSkillId];
                    if (reqNode) {
                        const lineElement = document.createElement("div");
                        lineElement.className = "skill-connection";
                        // 这里应该有更复杂的计算来确定连接线的位置和角度
                        skillsContainer.appendChild(lineElement);
                    }
                }
            }
            
            pathElement.appendChild(skillsContainer);
            skillTreeElement.appendChild(pathElement);
        }
    }
}
