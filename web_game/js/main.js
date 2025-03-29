// 游戏主入口文件

// 游戏状态
const GameState = {
    MENU: 'menu',
    EXPLORING: 'exploring',
    COMBAT: 'combat',
    INVENTORY: 'inventory',
    SKILLS: 'skills',
    QUEST: 'quest'
};

// 游戏主类
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentState = GameState.MENU;
        
        // 设置画布尺寸
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // 初始化游戏组件
        this.character = null;
        this.map = null;
        this.questSystem = null;
        this.combatSystem = null;
        this.equipmentSystem = null;
        this.skillSystem = null;
        this.ui = null;
        
        // 游戏循环相关
        this.lastTime = 0;
        this.frameId = null;
        
        // 绑定键盘事件
        this.setupEventListeners();
    }
    
    init() {
        // 完全重置游戏状态，防止加载错误的存档
        localStorage.removeItem(Storage.SAVE_KEY);
        
        // 清空界面状态
        document.getElementById('skill-tree-screen').classList.add('hidden');
        document.getElementById('inventory-screen').classList.add('hidden');
        
        // 设置初始状态为MENU，避免直接进入技能树状态
        this.currentState = GameState.MENU;
        
        // 初始化角色
        this.character = new Character('勇者', 1);
        this.character.game = this; // 确保角色能访问游戏对象
        
        // 按顺序初始化系统，确保依赖关系正确
        this.equipmentSystem = new EquipmentSystem(this);
        this.skillSystem = new SkillSystem(this);
        this.map = new GameMap(this);
        this.questSystem = new QuestSystem(this);
        this.combatSystem = new CombatSystem(this);
        
        // 确保新玩家获得初始装备和技能
        this.equipmentSystem.addItem("wooden_sword");
        if (!this.character.skills.some(s => s.id === "basic_slash")) {
            this.character.skills.push(this.skillSystem.getSkillById("basic_slash"));
        }
        
        // 最后初始化UI组件 - 这样其他组件都已准备就绪
        this.ui = new UI(this);
        
        // 开始游戏循环
        this.gameLoop(0);
        
        // 设置状态为探索 - 必须在UI初始化后
        this.changeState(GameState.EXPLORING);
        
        console.log("游戏初始化完成，当前状态:", this.currentState);
    }
    
    loadGameData() {
        // 尝试从本地存储加载游戏数据
        const savedData = Storage.loadGame();
        if (savedData) {
            // 恢复游戏状态
            this.character = Character.fromSaveData(savedData.character);
            console.log("游戏数据加载成功");
        } else {
            // 如果没有存档，给新玩家一些基础装备
            this.equipmentSystem.addItem("wooden_sword");
            this.character.skills.push(this.skillSystem.getSkillById("basic_slash"));
            console.log("创建了新的游戏存档");
        }
    }
    
    saveGameData() {
        // 保存当前游戏状态到本地存储
        const gameData = {
            character: this.character.getSaveData(),
            timestamp: new Date().toISOString()
        };
        
        const success = Storage.saveGame(gameData);
        
        if (success) {
            // 显示保存成功消息
            this.ui.showNotification("游戏已保存");
        } else {
            this.ui.showNotification("保存失败，请检查浏览器存储权限", "error");
        }
        
        return success;
    }
    
    changeState(newState) {
        console.log(`游戏状态变更: ${this.currentState} -> ${newState}`);
        
        // 退出当前状态的清理工作
        if (this.currentState === GameState.SKILLS) {
            // 确保退出技能树状态时关闭技能树界面
            if (this.skillSystem) {
                this.skillSystem.hideSkillTreeScreen();
            }
        } else if (this.currentState === GameState.INVENTORY) {
            // 确保退出物品栏状态时关闭物品栏界面
            if (this.equipmentSystem) {
                this.equipmentSystem.hideInventoryScreen();
            }
        }
        
        // 在改变状态前，强制关闭所有面板
        if (this.ui) {
            this.ui.closeAllPanels();
        }
        
        this.currentState = newState;
        
        // 进入新状态的初始化工作
        if (newState === GameState.EXPLORING) {
            // 确保角色HP不为0
            if (this.character && this.character.currentHp <= 0) {
                this.character.currentHp = 1;
            }
        }
        
        // 更新UI
        if (this.ui) {
            this.ui.updateUI();
        }
    }
    
    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 更新游戏状态
        this.update(deltaTime);
        
        // 渲染游戏
        this.render();
        
        // 继续循环
        this.frameId = requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    update(deltaTime) {
        // 根据当前状态更新游戏
        switch (this.currentState) {
            case GameState.EXPLORING:
                this.map.update(deltaTime);
                break;
            case GameState.COMBAT:
                this.combatSystem.update(deltaTime);
                break;
            case GameState.MENU:
                // 菜单状态的更新逻辑
                break;
            case GameState.INVENTORY:
            case GameState.SKILLS:
                // 这些状态主要由UI处理，不需要在这里更新
                break;
        }
    }
    
    render() {
        // 根据当前状态渲染游戏
        switch (this.currentState) {
            case GameState.EXPLORING:
                this.map.render(this.ctx);
                break;
            case GameState.COMBAT:
                this.combatSystem.render(this.ctx);
                break;
            case GameState.MENU:
                this.renderMenu();
                break;
            case GameState.INVENTORY:
            case GameState.SKILLS:
                // 这些UI已经以DOM形式呈现，不需要在画布上绘制
                this.map.render(this.ctx); // 仍然渲染地图作为背景
                break;
        }
    }
    
    renderMenu() {
        // 绘制游戏主菜单
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('新天骄：英雄崛起', this.canvas.width / 2, 100);
        
        // 其他菜单元素通过DOM处理...
    }
    
    setupEventListeners() {
        // 键盘控制
        window.addEventListener('keydown', (e) => {
            if (this.currentState === GameState.EXPLORING) {
                this.map.handleKeyDown(e);
            }
            
            // ESC键打开菜单
            if (e.key === 'Escape') {
                if (this.currentState === GameState.MENU) {
                    this.changeState(GameState.EXPLORING);
                } else if (this.currentState === GameState.EXPLORING) {
                    this.changeState(GameState.MENU);
                }
            }
        });
        
        // 窗口关闭前保存
        window.addEventListener('beforeunload', (e) => {
            if (this.currentState !== GameState.MENU) {
                this.saveGameData();
            }
        });
        
        // 窗口大小改变时调整画布
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }
    
    resizeCanvas() {
        // 根据窗口大小调整画布尺寸，保持比例
        const container = document.getElementById('game-container');
        const containerWidth = container.clientWidth;
        
        // 保持4:3比例
        this.canvas.width = containerWidth;
        this.canvas.height = containerWidth * 0.75;
    }
}

// 当页面加载完成时初始化游戏
window.addEventListener('load', () => {
    const game = new Game();
    game.init();
    
    // 保存游戏实例到全局供调试使用
    window.game = game;
});
