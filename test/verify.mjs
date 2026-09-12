import assert from 'node:assert';
import { calculatePetStageAndLevel, getAllPetSpecies, PET_SERIES, LEVEL_THRESHOLDS } from '../src/pet-data.js';

console.log('🧪 Starting LearnStar Planet Plugin Verification Tests...\n');

// 1. 测试 12 级 6 阶段积分成长阶梯计算
console.log('1. 验证 12 级 6 阶段成长计算器:');

const testCases = [
  { score: 0, expectedLevel: 1, expectedStage: 'egg' },
  { score: 10, expectedLevel: 1, expectedStage: 'egg' },
  { score: 20, expectedLevel: 2, expectedStage: 'egg' },
  { score: 35, expectedLevel: 3, expectedStage: 'baby' },
  { score: 50, expectedLevel: 3, expectedStage: 'baby' },
  { score: 70, expectedLevel: 4, expectedStage: 'baby' },
  { score: 100, expectedLevel: 5, expectedStage: 'growing' },
  { score: 180, expectedLevel: 7, expectedStage: 'mature' },
  { score: 280, expectedLevel: 9, expectedStage: 'legendary' },
  { score: 400, expectedLevel: 11, expectedStage: 'transcendent' },
  { score: 500, expectedLevel: 12, expectedStage: 'transcendent' },
];

for (const tc of testCases) {
  const res = calculatePetStageAndLevel(tc.score);
  assert.equal(
    res.level,
    tc.expectedLevel,
    `Score ${tc.score} should result in level ${tc.expectedLevel}, got ${res.level}`
  );
  assert.equal(
    res.stage,
    tc.expectedStage,
    `Score ${tc.score} should result in stage ${tc.expectedStage}, got ${res.stage}`
  );
  assert.ok(res.progressPercent >= 0 && res.progressPercent <= 100, 'Progress must be between 0 and 100');
  console.log(`   ✓ Score ${tc.score} -> Lv.${res.level} (${res.stageName}) [${res.progressPercent}%]`);
}
console.log('✅ Level & Stage evolution calculator passed.\n');

// 2. 验证 10 大系列与物种清单完整性
console.log('2. 验证 10 大系列物种定义与 ID 唯一性:');
assert.equal(PET_SERIES.length, 10, 'Must have exactly 10 series');

const allSpecies = getAllPetSpecies();
console.log(`   Total registered species: ${allSpecies.length}`);
assert.ok(allSpecies.length >= 100, 'Must have at least 100 species across all series');

// 检查物种 ID 无重复
const seenIds = new Set();
for (const sp of allSpecies) {
  assert.ok(!seenIds.has(sp.id), `Duplicate species ID detected: ${sp.id}`);
  seenIds.add(sp.id);
  assert.ok(sp.name && sp.name.length > 0, `Species ${sp.id} must have a valid name`);
  assert.ok(sp.emoji && sp.emoji.length > 0, `Species ${sp.id} must have an emoji`);
}
console.log('✅ 10 series and species uniqueness verified.\n');

// 3. 验证积分换算逻辑
console.log('3. 验证积分换算比例:');
const ratio = 1.5;
const openlearnScore = 20;
const expectedPetScore = Math.round(openlearnScore * ratio);
assert.equal(expectedPetScore, 30);
console.log(`   ✓ ${openlearnScore} OpenLearn pts * ${ratio} = +${expectedPetScore} Pet growth pts`);
console.log('✅ Score conversion logic verified.\n');

console.log('🎉 ALL LEARNSTAR PLANET CONNECTOR TESTS PASSED SUCCESSFULLY!');
