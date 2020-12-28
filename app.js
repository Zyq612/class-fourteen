function random(m, n) {
  return m + Math.floor(Math.random() * (n - m));
}

function randomItem(arr, from = 0, to = arr.length) {
  const index = random(from, to);
  return {
    index,
    value: arr[index],
  };
}

function shuffle(arr) {
  for(let i = arr.length; i > 0; i--) {
    const {index} = randomItem(arr, 0, i);
    [arr[index], arr[i - 1]] = [arr[i - 1], arr[index]];
  }
  return arr;
}

const prizeStorageKey = 'prize10';
function getResults() {
  const result = localStorage.getItem(prizeStorageKey);
  return result ? result.split(',') : [];
}
function addResults(players) {
  const result = getResults();
  result.push(...players);
  localStorage.setItem(prizeStorageKey, result.join());
}
function filterWinner(members) {
  const winners = new Set(getResults());
  return members.filter(m => !winners.has(m));
}

let members = [ 'whw', 'wl', 'hzs', 'csh', 'ld', 'lgs', 'coushu'
];

members = filterWinner(members);

const startBtn = document.getElementById('start');
const clearBtn = document.getElementById('clear');

startBtn.addEventListener('click', async () => {
  startBtn.disabled = 'disabled';
  clearBtn.disabled = 'disabled';

  // 重新洗牌
  shuffle(members);

  // 取出最后6名同学，倒数3名中奖，剩下3名凑数
  const candidates = members.slice(-6).reverse();

  // 将中奖结果保存到localStorage中
  addResults(candidates.slice(0, 3));
  members.length -= 3;

  await race(candidates);

  startBtn.disabled = '';
  clearBtn.disabled = '';
});

clearBtn.addEventListener('click', () => {
  localStorage.removeItem(prizeStorageKey);
});

const trackLen = 820; // 205 * 4

const trackEl = document.getElementById('track');

function partRace(durations, factor) {
  const subDuration = durations.map(d => d * factor * random(5, 15) / 10);
  subDuration.map((d, i) => {
    durations[i] -= d;
    return durations[i];
  });
  return subDuration;
}

function race(candidates) {
  const durations = [];
  for(let i = 0, duration = 0.9; i < candidates.length; i++) {
    durations.push(duration);
    duration += random(2, 5) * 0.01;
  }

  const players = shuffle([...candidates.entries()]);

  trackEl.innerHTML = players.map((p, i) => {
    return `<div>
      <span class="horse">${randomItem(['🐎', '🐖', '🐄', '🦔']).value}</span>
      <span class="player">${p[1]} ${i + 1}</span>
    </div>`;
  }).join('');

  const round1 = partRace(durations, 0.25);
  const round2 = partRace(durations, 0.33);
  const round3 = partRace(durations, 0.5);
  const round4 = durations.map(d => d + 0.1);

  const results = ['🥇', '🥈', '🥉', '😩', '😫', '😭'];

  const T = 8000;

  const horses = document.querySelectorAll('.horse');
  const promises = [];

  for(let i = 0; i < horses.length; i++) {
    const horse = horses[i];
    const idx = players[i][0];

    promises.push(raceHorse(horse, round1[idx] * T)
      .then(() => {
        return raceHorse(horse, round2[idx] * T, 30 + trackLen / 4);
      })
      .then(() => {
        return raceHorse(horse, round3[idx] * T, 30 + 2 * trackLen / 4);
      })
      .then(() => {
        return raceHorse(horse, round4[idx] * T, 30 + 3 * trackLen / 4);
      })
      .then(() => {
        horse.innerHTML = `<span>${results[idx]}</span>${horse.innerHTML}`;
        return raceHorse(horse, 0.1 * T, 30 + trackLen, 100);
      }));
  }

  return Promise.all(promises);
}

function raceHorse(horseEl, duration, from = 30, by = trackLen / 4) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    requestAnimationFrame(function f() {
      let p = (Date.now() - startTime) / duration;
      p = Math.min(p, 1.0);
      horseEl.style.left = `${from + p * by}px`;
      if(p < 1.0) requestAnimationFrame(f);
      else resolve();
    });
  });
}
