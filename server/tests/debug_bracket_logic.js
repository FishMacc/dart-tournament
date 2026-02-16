
import { generateBracket } from '../src/bracket.js';
import { createPlayer } from '../src/models.js';

const players = [];
for (let i = 1; i <= 5; i++) {
    players.push(createPlayer(`Player${i}`));
}

console.log('Generating bracket for 5 players...');
const rounds = generateBracket(players);

console.log(`Structure: ${rounds.length} rounds.`);
rounds.forEach((round, rIdx) => {
    console.log(`Round ${rIdx}: ${round.length} matches`);
    round.forEach((m, mIdx) => {
        const p1 = m.player1 ? m.player1.name : 'null';
        const p2 = m.player2 ? m.player2.name : 'null';
        console.log(`  M${mIdx}: ${p1} vs ${p2} [${m.status}]`);
    });
});

// Check if any match is playable in R2 (Round 1 index)
const r2 = rounds[1];
const waitingMatches = r2.filter(m => m.status === 'waiting' && m.player1 && m.player2);
console.log(`\nPlayable matches in R2 (initially): ${waitingMatches.length}`);
waitingMatches.forEach(m => console.log(`  M${m.id}: ${m.player1.name} vs ${m.player2.name}`));
