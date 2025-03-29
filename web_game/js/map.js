// 地图系统

class GameMap {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        
        // 动态计算瓦片大小以适应屏幕
        this.calculateTileSize();
        
        this.mapWidth = 50; // 更大的地图宽度（格子数）
        this.mapHeight = 40; // 更大的地图高度（格子数）
        this.tiles = [];
        this.npcs = [];
        this.monsters = [];
        this.interactables = [];
        
        // 移除对tileset图片的依赖
        // this.tilesetImage = new Image();
        // this.tilesetImage.src = 'assets/images/tileset.png';
        
        // 定义不同瓦片类型的颜色
        this.tileColors = {
            0: '#7ec850', // 草地
            1: '#5d4037', // 墙
            2: '#3949ab', // 水
            3: '#795548', // 道路
            4: '#8d6e63', // 山地
            5: '#ffeb3b'  // 沙地
        };
        
        // 生成地图
        this.generateMap();
        
        // 初始化视口（相机）位置
        this.viewportX = 0;
        this.viewportY = 0;
    }
    
    calculateTileSize() {
        // 根据画布大小动态计算瓦片大小
        // 尝试让每个方向上至少显示20个瓦片
        const minTilesX = 20;
        const minTilesY = 15;
        
        this.tileSize = Math.min(
            Math.floor(this.canvas.width / minTilesX),
            Math.floor(this.canvas.height / minTilesY)
        );
        
        // 确保瓦片大小至少为16像素
        this.tileSize = Math.max(16, this.tileSize);
        
        // 根据画布大小计算视口可显示的瓦片数量
        this.viewportTilesX = Math.ceil(this.canvas.width / this.tileSize);
        this.viewportTilesY = Math.ceil(this.canvas.height / this.tileSize);
    }
    
    generateMap() {
        // 清空当前地图
        this.tiles = [];
        
        // 生成更加复杂的地图，包含不同类型的地形
        for (let y = 0; y < this.mapHeight; y++) {
            const row = [];
            for (let x = 0; x < this.mapWidth; x++) {
                // 边界为墙
                if (x === 0 || y === 0 || x === this.mapWidth - 1 || y === this.mapHeight - 1) {
                    row.push(1); // 墙
                } else if (x % 15 === 0 || y % 12 === 0) {
                    // 创建道路网格
                    row.push(3); // 道路
                } else if (Math.random() < 0.03) {
                    // 随机添加一些水域
                    row.push(2); // 水
                } else if (Math.random() < 0.05) {
                    // 随机添加一些山地
                    row.push(4); // 山地
                } else if (Math.random() < 0.05) {
                    // 随机添加一些沙地
                    row.push(5); // 沙地
                } else if (Math.random() < 0.08) {
                    // 随机添加一些墙作为障碍物
                    row.push(1); // 墙
                } else {
                    row.push(0); // 基本地形 - 草地
                }
            }
            this.tiles.push(row);
        }
        
        // 添加安全区域（村庄中心）
        const centerX = Math.floor(this.mapWidth / 2);
        const centerY = Math.floor(this.mapHeight / 2);
        const safeRadius = 5;
        
        for (let y = centerY - safeRadius; y <= centerY + safeRadius; y++) {
            for (let x = centerX - safeRadius; x <= centerX + safeRadius; x++) {
                if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
                    // 村庄中心使用道路瓦片
                    this.tiles[y][x] = 3;
                    
                    // 设置村庄边界
                    if (Math.abs(x - centerX) === safeRadius || Math.abs(y - centerY) === safeRadius) {
                        // 村庄周围是围墙
                        this.tiles[y][x] = 1;
                    }
                }
            }
        }
        
        // 添加NPC到村庄中心
        this.npcs = [];
        this.npcs.push({
            x: centerX,
            y: centerY,
            name: "村长",
            dialogue: "欢迎来到新天骄世界，勇者！我有一个任务要交给你。",
            questId: "quest1"
        });
        
        this.npcs.push({
            x: centerX + 2,
            y: centerY - 1,
            name: "铁匠",
            dialogue: "我可以为你打造更好的装备，只要你有足够的金币。",
            shopType: "weapons"
        });
        
        // 添加怪物刷新点 - 在地图的不同区域
        this.monsters = [];
        this.addMonsterSpawner(centerX + 10, centerY + 8, "小妖精");
        this.addMonsterSpawner(centerX - 12, centerY + 5, "森林狼");
        this.addMonsterSpawner(centerX + 15, centerY - 10, "山贼");
        
        // 添加可交互物体 - 宝箱和其他物品
        this.interactables = [];
        this.interactables.push({
            x: centerX + 3,
            y: centerY + 3,
            type: "chest",
            opened: false,
            content: {
                gold: 50,
                items: ["初级剑"]
            }
        });
        
        // 设置角色起始位置为村庄中心
        this.game.character.x = (centerX + 1) * this.tileSize;
        this.game.character.y = (centerY + 1) * this.tileSize;
    }
    
    addMonsterSpawner(x, y, monsterType) {
        // 添加怪物刷新点
        this.monsters.push({
            x: x,
            y: y,
            type: monsterType,
            respawnTime: 0
        });
    }
    
    update(deltaTime) {
        // 更新地图上的怪物和NPC
        this.updateMonsters(deltaTime);
        
        // 更新视口位置跟随角色
        this.updateViewport();
    }
    
    updateMonsters(deltaTime) {
        // 处理怪物重生和移动
        for (let i = 0; i < this.monsters.length; i++) {
            const monster = this.monsters[i];
            
            // 怪物AI和移动逻辑
        }
    }
    
    updateViewport() {
        const character = this.game.character;
        
        // 计算理想的视口中心（角色位置）
        const targetViewportX = Math.max(0, character.x - this.canvas.width / 2);
        const targetViewportY = Math.max(0, character.y - this.canvas.height / 2);
        
        // 限制视口不超出地图边界
        const maxViewportX = Math.max(0, this.mapWidth * this.tileSize - this.canvas.width);
        const maxViewportY = Math.max(0, this.mapHeight * this.tileSize - this.canvas.height);
        
        this.viewportX = Math.min(targetViewportX, maxViewportX);
        this.viewportY = Math.min(targetViewportY, maxViewportY);
    }
    
    render(ctx) {
        // 清除画布
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 计算可见瓦片的范围
        const startCol = Math.floor(this.viewportX / this.tileSize);
        const endCol = Math.min(this.mapWidth - 1, startCol + this.viewportTilesX + 1);
        const startRow = Math.floor(this.viewportY / this.tileSize);
        const endRow = Math.min(this.mapHeight - 1, startRow + this.viewportTilesY + 1);
        
        // 绘制可见的地图瓦片
        for (let y = startRow; y <= endRow; y++) {
            for (let x = startCol; x <= endCol; x++) {
                const tileType = this.tiles[y][x];
                const tileX = x * this.tileSize - this.viewportX;
                const tileY = y * this.tileSize - this.viewportY;
                
                // 使用颜色而非图片绘制瓦片
                ctx.fillStyle = this.tileColors[tileType] || '#7ec850';
                ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                
                // 给瓦片添加简单的边框以区分
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.strokeRect(tileX, tileY, this.tileSize, this.tileSize);
            }
        }
        
        // 绘制可见的NPCs
        for (const npc of this.npcs) {
            const screenX = npc.x * this.tileSize - this.viewportX;
            const screenY = npc.y * this.tileSize - this.viewportY;
            
            // 只绘制视口内的NPC
            if (this.isInViewport(screenX, screenY)) {
                ctx.fillStyle = '#3f51b5';
                ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                
                // 添加NPC标签
                ctx.fillStyle = 'white';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(npc.name, screenX + this.tileSize / 2, screenY - 5);
            }
        }
        
        // 绘制可见的怪物
        for (const monster of this.monsters) {
            const screenX = monster.x * this.tileSize - this.viewportX;
            const screenY = monster.y * this.tileSize - this.viewportY;
            
            if (this.isInViewport(screenX, screenY)) {
                ctx.fillStyle = '#f44336';
                ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                
                // 添加怪物标签
                ctx.fillStyle = 'white';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(monster.type, screenX + this.tileSize / 2, screenY - 5);
            }
        }
        
        // 绘制可见的交互物体
        for (const item of this.interactables) {
            const screenX = item.x * this.tileSize - this.viewportX;
            const screenY = item.y * this.tileSize - this.viewportY;
            
            if (this.isInViewport(screenX, screenY)) {
                // 不同的交互物体用不同的颜色
                if (item.type === "chest") {
                    ctx.fillStyle = item.opened ? '#a1887f' : '#ffc107';
                } else {
                    ctx.fillStyle = '#9c27b0';
                }
                
                ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
            }
        }
        
        // 绘制角色（相对于视口位置）
        const character = this.game.character;
        const charScreenX = character.x - this.viewportX;
        const charScreenY = character.y - this.viewportY;
        
        if (character.sprite && character.sprite.complete) {
            ctx.drawImage(character.sprite, charScreenX, charScreenY, this.tileSize, this.tileSize);
        } else {
            // 使用颜色方块代替角色图像
            ctx.fillStyle = '#2196f3';
            ctx.fillRect(charScreenX, charScreenY, this.tileSize, this.tileSize);
            
            // 在角色上方显示名称
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(character.name, charScreenX + this.tileSize / 2, charScreenY - 5);
        }
        
        // 添加小地图（可选）
        this.renderMinimap(ctx);
    }
    
    isInViewport(x, y) {
        return x >= -this.tileSize && 
               x <= this.canvas.width && 
               y >= -this.tileSize && 
               y <= this.canvas.height;
    }
    
    renderMinimap(ctx) {
        // 绘制小地图在右下角
        const minimapSize = 150;
        const minimapX = this.canvas.width - minimapSize - 10;
        const minimapY = this.canvas.height - minimapSize - 10;
        const tileRatio = minimapSize / (this.mapWidth * this.tileSize);
        
        // 小地图背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
        
        // 绘制小地图上的地形
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tileType = this.tiles[y][x];
                const miniX = minimapX + x * tileRatio * this.tileSize;
                const miniY = minimapY + y * tileRatio * this.tileSize;
                const miniSize = Math.max(1, this.tileSize * tileRatio);
                
                ctx.fillStyle = this.tileColors[tileType] || '#7ec850';
                ctx.fillRect(miniX, miniY, miniSize, miniSize);
            }
        }
        
        // 绘制小地图上的角色
        const character = this.game.character;
        const miniCharX = minimapX + (character.x / this.tileSize) * tileRatio * this.tileSize;
        const miniCharY = minimapY + (character.y / this.tileSize) * tileRatio * this.tileSize;
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(miniCharX, miniCharY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制视口区域
        const viewX = minimapX + (this.viewportX / this.tileSize) * tileRatio * this.tileSize;
        const viewY = minimapY + (this.viewportY / this.tileSize) * tileRatio * this.tileSize;
        const viewWidth = this.canvas.width * tileRatio;
        const viewHeight = this.canvas.height * tileRatio;
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(viewX, viewY, viewWidth, viewHeight);
    }
    
    // 碰撞检测 - 更新以使用更多地形类型
    isCollision(x, y) {
        // 转换为格子坐标
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        // 检查是否超出地图范围
        if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) {
            return true;
        }
        
        // 检查是否是不可通行的地形（墙、水、山地）
        const tileType = this.tiles[tileY][tileX];
        return tileType === 1 || tileType === 2 || tileType === 4;
    }
    
    // 处理键盘输入 - 更新以支持更大地图和视口
    handleKeyDown(e) {
        const character = this.game.character;
        let dx = 0, dy = 0;
        
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                dy = -1;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                dy = 1;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                dx = -1;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                dx = 1;
                break;
            case 'e':
            case 'E':
                this.interact();
                break;
            case 'm':
            case 'M':
                // 切换小地图显示（可以实现这个功能）
                break;
        }
        
        // 计算新位置
        const newX = character.x + dx * character.speed;
        const newY = character.y + dy * character.speed;
        
        // 如果没有碰撞则移动
        if (!this.isCollision(newX, newY)) {
            character.move(dx, dy);
            this.updateViewport(); // 移动后更新视口
        }
        
        // 检查是否遇到怪物
        this.checkMonsterEncounter();
    }
    
    interact() {
        // 与附近NPC或物体互动
        const character = this.game.character;
        const charTileX = Math.floor(character.x / this.tileSize);
        const charTileY = Math.floor(character.y / this.tileSize);
        
        // 检查NPC
        for (const npc of this.npcs) {
            if (Math.abs(npc.x - charTileX) <= 1 && Math.abs(npc.y - charTileY) <= 1) {
                console.log(`与 ${npc.name} 对话: ${npc.dialogue}`);
                
                // 显示对话框
                this.game.ui.showDialog(npc.name, npc.dialogue);
                
                // 如果NPC有任务，触发任务系统
                if (npc.questId) {
                    this.game.questSystem.startQuest(npc.questId);
                }
                
                // 如果是商店NPC
                if (npc.shopType) {
                    // 实现打开商店功能
                    console.log(`打开${npc.name}的商店`);
                }
                
                return;
            }
        }
        
        // 检查可交互物体
        for (const item of this.interactables) {
            if (Math.abs(item.x - charTileX) <= 1 && Math.abs(item.y - charTileY) <= 1) {
                if (item.type === "chest" && !item.opened) {
                    console.log("打开宝箱！获得: " + item.content.gold + " 金币");
                    character.gold += item.content.gold;
                    
                    // 添加物品到装备系统
                    for (const itemName of item.content.items) {
                        this.game.equipmentSystem.addItem(itemName);
                    }
                    
                    item.opened = true;
                    this.game.ui.showNotification(`获得 ${item.content.gold} 金币和 ${item.content.items.length} 件物品！`);
                }
                return;
            }
        }
    }
    
    checkMonsterEncounter() {
        // 检查是否遇到怪物
        const character = this.game.character;
        const charTileX = Math.floor(character.x / this.tileSize);
        const charTileY = Math.floor(character.y / this.tileSize);
        
        for (const monster of this.monsters) {
            if (monster.x === charTileX && monster.y === charTileY) {
                console.log(`遇到了 ${monster.type}！`);
                this.game.combatSystem.startCombat(monster.type);
                break;
            }
        }
    }
}
