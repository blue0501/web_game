# 游戏数据文件夹

这个文件夹用于存储游戏的各种数据文件，包括但不限于：

- 怪物数据
- 装备数据
- 技能数据
- 任务数据
- 地图数据

在完整实现中，我们应该将这些数据从代码中分离出来，存储为独立的JSON文件，这样可以更方便地编辑和管理游戏内容。

## 示例数据结构

### monsters.json
```json
{
  "小妖精": {
    "baseHp": 30,
    "baseAttack": 5,
    "baseDefense": 2,
    "expReward": 20,
    "goldReward": 10,
    "levelScaling": {
      "hp": 10,
      "attack": 2,
      "defense": 1
    }
  }
}
```

### equipment.json
```json
{
  "wooden_sword": {
    "name": "木剑",
    "type": "weapon",
    "level": 1,
    "attackBonus": 5,
    "defenseBonus": 0,
    "description": "新手冒险者的第一把剑。"
  }
}
```

### quests.json
```json
{
  "quest1": {
    "title": "消灭小妖精",
    "description": "消灭5只小妖精以保护村庄安全。",
    "objectives": {
      "kill": {
        "targetType": "小妖精",
        "required": 5
      }
    },
    "rewards": {
      "experience": 200,
      "gold": 100,
      "items": ["初级皮甲"]
    }
  }
}
```
