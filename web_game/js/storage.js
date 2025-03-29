// 游戏存储系统

class Storage {
    static SAVE_KEY = "new_hero_save_data";
    
    static saveGame(gameData) {
        try {
            const saveData = JSON.stringify(gameData);
            localStorage.setItem(this.SAVE_KEY, saveData);
            console.log("游戏保存成功");
            return true;
        } catch (error) {
            console.error("保存游戏失败:", error);
            return false;
        }
    }
    
    static loadGame() {
        try {
            const saveData = localStorage.getItem(this.SAVE_KEY);
            if (!saveData) {
                console.log("没有找到保存的游戏存档");
                return null;
            }
            
            const gameData = JSON.parse(saveData);
            console.log("游戏加载成功");
            return gameData;
        } catch (error) {
            console.error("加载游戏失败:", error);
            return null;
        }
    }
    
    static deleteSave() {
        try {
            localStorage.removeItem(this.SAVE_KEY);
            console.log("游戏存档已删除");
            return true;
        } catch (error) {
            console.error("删除存档失败:", error);
            return false;
        }
    }
    
    static hasSaveData() {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }
    
    // 添加自动保存功能
    static setupAutoSave(game, intervalMinutes = 5) {
        // 每隔指定分钟自动保存一次游戏
        const intervalMs = intervalMinutes * 60 * 1000;
        
        setInterval(() => {
            if (game.currentState === GameState.EXPLORING || 
                game.currentState === GameState.INVENTORY || 
                game.currentState === GameState.SKILLS) {
                
                game.saveGameData();
                console.log("游戏已自动保存");
            }
        }, intervalMs);
    }
    
    // 添加导出存档功能
    static exportSave() {
        try {
            const saveData = localStorage.getItem(this.SAVE_KEY);
            if (!saveData) {
                console.log("没有找到可导出的存档");
                return null;
            }
            
            // 创建一个包含时间戳的存档标识
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const exportData = {
                timestamp: timestamp,
                saveData: JSON.parse(saveData)
            };
            
            // 将导出数据转换为JSON字符串并编码
            const exportString = JSON.stringify(exportData);
            const encodedData = btoa(exportString);
            
            return encodedData;
        } catch (error) {
            console.error("导出存档失败:", error);
            return null;
        }
    }
    
    // 添加导入存档功能
    static importSave(encodedData) {
        try {
            // 解码并解析导入的数据
            const exportString = atob(encodedData);
            const exportData = JSON.parse(exportString);
            
            // 验证导入数据的格式
            if (!exportData.timestamp || !exportData.saveData) {
                console.error("导入的存档格式无效");
                return false;
            }
            
            // 保存导入的存档数据
            const saveData = JSON.stringify(exportData.saveData);
            localStorage.setItem(this.SAVE_KEY, saveData);
            
            console.log(`成功导入于 ${exportData.timestamp} 创建的存档`);
            return true;
        } catch (error) {
            console.error("导入存档失败:", error);
            return false;
        }
    }
}
