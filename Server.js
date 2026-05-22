const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Serve static frontend files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Match Simulation Engine Initialization Data
let matches = [
  { id: 'p1', league: 'Premier League', homeTeam: 'Arsenal', awayTeam: 'Chelsea', status: 'LIVE', minute: 0, score: { home: 0, away: 0 }, momentum: 0, odds: {}, commentary: ['Match Kicked Off!'] },
  { id: 'l1', league: 'La Liga', homeTeam: 'Real Madrid', awayTeam: 'Barcelona', status: 'LIVE', minute: 0, score: { home: 0, away: 0 }, momentum: 0, odds: {}, commentary: ['Match Kicked Off!'] },
  { id: 's1', league: 'Serie A', homeTeam: 'Juventus', awayTeam: 'AC Milan', status: 'LIVE', minute: 0, score: { home: 0, away: 0 }, momentum: 0, odds: {}, commentary: ['Match Kicked Off!'] }
];

// Dynamic Odds Calculation Function
function calculateOdds(minute, homeScore, awayScore) {
  const timeFactor = (90 - minute) / 90;
  const scoreDiff = homeScore - awayScore;

  let homeOdds = 2.0 - (scoreDiff * 0.5) + (1 - timeFactor);
  let awayOdds = 2.0 + (scoreDiff * 0.5) + (1 - timeFactor);
  let drawOdds = 3.0 + (timeFactor * 2);

  return {
    '1X2': { '1': Math.max(1.01, homeOdds), 'X': Math.max(1.05, drawOdds), '2': Math.max(1.01, awayOdds) },
    'DOUBLE_CHANCE': { '1X': Math.max(1.02, homeOdds * 0.6), '12': Math.max(1.02, ((homeOdds + awayOdds) / 2) * 0.5), 'X2': Math.max(1.02, awayOdds * 0.6) },
    'OVER_UNDER_2.5': { 'Over 2.5': Math.max(1.1, 1.8 + (homeScore + awayScore) * 0.2), 'Under 2.5': Math.max(1.1, 3.5 - (homeScore + awayScore) * 0.4) }
  };
}

// Global Core Simulation Engine Loop (Updates every 1 second)
setInterval(() => {
  matches.forEach(match => {
    if (match.status !== 'LIVE') return;

    match.minute += 1;
    if (match.minute >= 90) {
      match.status = 'FINISHED';
      match.commentary.unshift('Full time whistle blows!');
      return;
    }

    // Shift attack momentum dynamically (-100 to +100)
    match.momentum = Math.max(-100, Math.min(100, match.momentum + (Math.random() * 40 - 20)));
    
    // 4% chance of a major goal-scoring event every simulated minute
    if (Math.random() < 0.04) {
      const isHomeAttacking = match.momentum > 0;
      const attackingTeam = isHomeAttacking ? match.homeTeam : match.awayTeam;
      
      if (Math.random() < 0.3) { // 30% of key attacks result in a goal
        if (isHomeAttacking) match.score.home += 1;
        else match.score.away += 1;
        match.commentary.unshift(`GOAL!! ${attackingTeam} scores! (${match.score.home}-${match.score.away})`);
        match.momentum = isHomeAttacking ? -30 : 30; // reset slightly away from scoring team
      } else {
        match.commentary.unshift(`Dangerous attack from ${attackingTeam} cleared out.`);
      }
    }

    match.odds = calculateOdds(match.minute, match.score.home, match.score.away);
  });

  io.emit('match_updates', matches);
}, 1000);

// Fallback routing to support clean client URL matching
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Full-Stack Simulator Engine live on port ${PORT}`));
