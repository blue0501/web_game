// 角色系统

class Character {
    constructor(name, level = 1) {
        this.name = name;
        this.level = level;
        this.maxHp = 100 + (level - 1) * 20;
        this.currentHp = this.maxHp;
        this.baseAttack = 10 + (level - 1) * 3;
        this.baseDefense = 5 + (level - 1) * 2;
        this.experience = 0;
        this.gold = 100;
        
        // 明确定义game属性
        this.game = null;
        
        // 升级所需经验
        this.expToNextLevel = this.calculateExpToNextLevel();
        
        // 装备槽位
        this.equipment = {
            weapon: null,
            armor: null,
            helmet: null,
            accessory: null
        };
        
        // 已习得技能
        this.skills = [];
        
        // 任务列表
        this.activeQuests = [];
        this.completedQuests = [];
        
        // 角色位置
        this.x = 400;
        this.y = 300;
        this.speed = 3;
        
        // 角色图像
        this.sprite = null;
        this.loadSprite();
    }
    
    loadSprite() {
        // 加载角色图像
        this.sprite = new Image();
        this.sprite.src = 'assets/images/character.png';
    }
    
    // 获取角色当前属性（包含装备加成）
    getAttack() {
        let totalAttack = this.baseAttack;
        
        // 添加装备加成
        for (const slot in this.equipment) {
            if (this.equipment[slot]) {
                totalAttack += this.equipment[slot].attackBonus || 0;
            }
        }
        
        return totalAttack;
    }
    
    getDefense() {
        let totalDefense = this.baseDefense;
        
        // 添加装备加成
        for (const slot in this.equipment) {
            if (this.equipment[slot]) {
                totalDefense += this.equipment[slot].defenseBonus || 0;
            }
        }
        
        return totalDefense;
    }
    
    // 角色升级
    gainExperience(amount) {
        this.experience += amount;
        
        // 检查是否可以升级
        while (this.experience >= this.expToNextLevel) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level += 1;
        this.experience -= this.expToNextLevel;
        
        // 增加基础属性
        this.maxHp += 20;
        this.currentHp = this.maxHp;
        this.baseAttack += 3;
        this.baseDefense += 2;
        
        // 计算下一级所需经验
        this.expToNextLevel = this.calculateExpToNextLevel();
        
        // 触发升级事件
        console.log(`${this.name} 升级到 ${this.level} 级！`);
    }
    
    calculateExpToNextLevel() {
        // 简单的经验计算公式
        return 100 * Math.pow(1.5, this.level - 1);
    }
    
    // 角色移动 - 更新为使用像素位置而非网格位置
    move(dx, dy) {
        const tileSize = this.game ? this.game.map.tileSize : 32;
        this.x += dx * this.speed;
        this.y += dy * this.speed;
        
        // 防止角色移出地图边界
        const mapWidth = this.game ? this.game.map.mapWidth * tileSize : 800;
        const mapHeight = this.game ? this.game.map.mapHeight * tileSize : 600;
        
        this.x = Math.max(0, Math.min(this.x, mapWidth - tileSize));
        this.y = Math.max(0, Math.min(this.y, mapHeight - tileSize));
    }
    
    // 战斗相关方法
    takeDamage(amount) {
        const actualDamage = Math.max(1, amount - this.getDefense() / 2);
        this.currentHp -= actualDamage;
        
        if (this.currentHp < 0) {
            this.currentHp = 0;
        }
        
        return actualDamage;
    }
    
    heal(amount) {
        this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
    }
    
    // 保存和加载角色数据
    getSaveData() {
        return {
            name: this.name,
            level: this.level,
            maxHp: this.maxHp,
            currentHp: this.currentHp,
            baseAttack: this.baseAttack,
            baseDefense: this.baseDefense,
            experience: this.experience,
            gold: this.gold,
            equipment: this.equipment,
            skills: this.skills,
            activeQuests: this.activeQuests,
            completedQuests: this.completedQuests,
            x: this.x,
            y: this.y
        };
    }
    
    static fromSaveData(data) {
        const character = new Character(data.name, data.level);
        character.maxHp = data.maxHp;
        character.currentHp = data.currentHp;
        character.baseAttack = data.baseAttack;
        character.baseDefense = data.baseDefense;
        character.experience = data.experience;
        character.gold = data.gold;
        character.equipment = data.equipment;
        character.skills = data.skills;
        character.activeQuests = data.activeQuests;
        character.completedQuests = data.completedQuests;
        character.x = data.x;
        character.y = data.y;
        
        return character;
    }
}
